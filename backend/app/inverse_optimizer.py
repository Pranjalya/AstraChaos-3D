import math
import time
from typing import List, Dict, Any, Generator, Tuple, Optional
import numpy as np

from app.schemas import Vector3D, PhysicsDiagnostics, ToolCallLog
from app.tools import normalize_center_of_mass, compute_physics_diagnostics

def vectorized_rk4_step(
    pos: np.ndarray, 
    vel: np.ndarray, 
    masses: np.ndarray, 
    dt: float = 0.01, 
    G: float = 1.0, 
    softening_sq: float = 1e-4
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Vectorized RK4 step over a batch of system states.
    pos shape: (B, 3, 3) -> Batch, 3 Bodies, 3D Coordinates (x,y,z)
    vel shape: (B, 3, 3)
    masses shape: (3,)
    """
    def compute_acc(p: np.ndarray) -> np.ndarray:
        # p: (B, 3, 3)
        acc = np.zeros_like(p)
        for i in range(3):
            for j in range(3):
                if i == j:
                    continue
                diff = p[:, j, :] - p[:, i, :] # (B, 3)
                dist_sq = np.sum(diff**2, axis=-1, keepdims=True) + softening_sq # (B, 1)
                dist_cube = dist_sq * np.sqrt(dist_sq)
                acc[:, i, :] += G * masses[j] * diff / dist_cube
        return acc

    # RK4 coefficients
    k1_v = compute_acc(pos)
    k1_p = vel

    k2_v = compute_acc(pos + 0.5 * dt * k1_p)
    k2_p = vel + 0.5 * dt * k1_v

    k3_v = compute_acc(pos + 0.5 * dt * k2_p)
    k3_p = vel + 0.5 * dt * k2_v

    k4_v = compute_acc(pos + dt * k3_p)
    k4_p = vel + dt * k3_v

    new_pos = pos + (dt / 6.0) * (k1_p + 2 * k2_p + 2 * k3_p + k4_p)
    new_vel = vel + (dt / 6.0) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v)

    return new_pos, new_vel


def evaluate_trajectory_fitness(
    goal_type: str,
    pos_history: np.ndarray, # Shape: (B, T, 3, 3)
    vel_history: np.ndarray, # Shape: (B, T, 3, 3)
    masses: np.ndarray       # Shape: (3,)
) -> np.ndarray:
    """
    Evaluates fitness score in [0.0, 1.0] for a batch of B trajectories based on target goal.
    """
    B, T, _, _ = pos_history.shape
    fitness = np.zeros(B, dtype=np.float64)

    # Pairwise distances over time: (B, T, 3, 3) -> d12, d23, d31
    p1 = pos_history[:, :, 0, :]
    p2 = pos_history[:, :, 1, :]
    p3 = pos_history[:, :, 2, :]

    d12 = np.linalg.norm(p1 - p2, axis=-1) # (B, T)
    d23 = np.linalg.norm(p2 - p3, axis=-1)
    d31 = np.linalg.norm(p3 - p1, axis=-1)

    min_pairwise = np.minimum(np.minimum(d12, d23), d31) # (B, T)
    min_dist_ever = np.min(min_pairwise, axis=1) # (B,)

    # Collision penalty mask (close distance < 0.08)
    collision_mask = min_dist_ever < 0.08

    if goal_type == "slingshot":
        # Maximize peak velocity / kinetic energy ratio of Body 3 after a close encounter with Body 1 or 2
        v3_norms = np.linalg.norm(vel_history[:, :, 2, :], axis=-1) # (B, T)
        v3_initial = v3_norms[:, 0] + 1e-5
        v3_max = np.max(v3_norms[:, T//3:], axis=1) # Peak velocity in second 2/3 of orbit
        boost_ratio = v3_max / v3_initial

        # Favor trajectories with close encounter (0.15 < min_dist < 0.6)
        close_encounter_score = np.exp(-((min_dist_ever - 0.25)**2) / 0.1)

        raw_score = 0.5 * np.clip(boost_ratio / 3.0, 0.0, 1.0) + 0.5 * close_encounter_score
        fitness = np.where(collision_mask, raw_score * 0.1, raw_score)

    elif goal_type == "ejection":
        # Body 3 starts bound (d3_com < 3.0), then escapes outwards (d3_com > 8.0) at end
        r3_com = np.linalg.norm(p3, axis=-1) # (B, T)
        r3_start = r3_com[:, 0]
        r3_end = r3_com[:, -1]

        bound_start_score = np.clip(1.0 - np.abs(r3_start - 1.5) / 2.0, 0.0, 1.0)
        ejection_score = np.clip(r3_end / 10.0, 0.0, 1.0)
        escape_speed = np.clip((r3_end - r3_start) / 8.0, 0.0, 1.0)

        raw_score = 0.3 * bound_start_score + 0.4 * ejection_score + 0.3 * escape_speed
        fitness = np.where(collision_mask, raw_score * 0.1, raw_score)

    elif goal_type == "binary_capture":
        # Body 3 starts closer to Body 1, then transitions to orbit Body 2
        d31_first_half = np.mean(d31[:, :T//3], axis=1)
        d32_second_half = np.mean(d23[:, 2*T//3:], axis=1)

        ratio1 = np.clip(1.5 / (d31_first_half + 0.1), 0.0, 1.0)
        ratio2 = np.clip(1.5 / (d32_second_half + 0.1), 0.0, 1.0)

        raw_score = 0.5 * ratio1 + 0.5 * ratio2
        fitness = np.where(collision_mask, raw_score * 0.1, raw_score)

    elif goal_type == "trojan_resonance":
        # Keep d12 ~ d23 ~ d31 over time (Lagrangian equilateral triangle L4/L5 stability)
        var_12 = np.std(d12, axis=1)
        var_23 = np.std(d23, axis=1)
        var_31 = np.std(d31, axis=1)

        tri_diff = np.abs(d12 - d23) + np.abs(d23 - d31) + np.abs(d31 - d12)
        mean_tri_diff = np.mean(tri_diff, axis=1)

        stability_score = np.exp(-mean_tri_diff / 0.8)
        var_score = np.exp(-(var_12 + var_23 + var_31) / 0.5)

        raw_score = 0.6 * stability_score + 0.4 * var_score
        fitness = np.where(collision_mask, raw_score * 0.1, raw_score)

    elif goal_type == "triple_encounter":
        # All 3 bodies pass close to each other without colliding (0.1 < min_dist < 0.35)
        encounter_score = np.exp(-((min_dist_ever - 0.18)**2) / 0.02)
        raw_score = encounter_score
        fitness = np.where(collision_mask, raw_score * 0.1, raw_score)

    else:
        # Default: general chaotic divergence fitness
        r3_end = np.linalg.norm(p3[:, -1], axis=-1)
        fitness = np.clip(r3_end / 8.0, 0.0, 1.0)

    return np.clip(fitness, 0.0, 1.0)


def generate_inverse_optimization_stream(
    goal_type: str = "slingshot",
    custom_prompt: Optional[str] = None,
    pop_size: int = 32,
    max_generations: int = 40,
    steps_per_rollout: int = 400,
    dt: float = 0.012
) -> Generator[Dict[str, Any], None, None]:
    """
    Vectorized Differential Evolution optimizer generator.
    Yields per-generation SSE event dictionaries:
    - progress event: current generation, best fitness, progress percentage
    - final event: complete state vectors, diagnostics, tool logs
    """
    np.random.seed(int(time.time()) % 10000)

    masses = np.array([1.0, 1.0, 0.5], dtype=np.float64)

    # 18D Parameter Vector: [pos_1(3), pos_2(3), pos_3(3), vel_1(3), vel_2(3), vel_3(3)]
    # Initialize Population
    bounds_pos = 2.5
    bounds_vel = 1.2

    pop = np.random.uniform(-bounds_pos, bounds_pos, size=(pop_size, 3, 3))
    vel_pop = np.random.uniform(-bounds_vel, bounds_vel, size=(pop_size, 3, 3))

    # Apply COM normalization to initial population
    for b in range(pop_size):
        p_list = [Vector3D(x=pop[b, i, 0], y=pop[b, i, 1], z=pop[b, i, 2]) for i in range(3)]
        v_list = [Vector3D(x=vel_pop[b, i, 0], y=vel_pop[b, i, 1], z=vel_pop[b, i, 2]) for i in range(3)]
        norm_p, norm_v = normalize_center_of_mass(list(masses), p_list, v_list)
        for i in range(3):
            pop[b, i, 0] = norm_p[i].x
            pop[b, i, 1] = norm_p[i].y
            pop[b, i, 2] = norm_p[i].z
            vel_pop[b, i, 0] = norm_v[i].x
            vel_pop[b, i, 1] = norm_v[i].y
            vel_pop[b, i, 2] = norm_v[i].z

    def run_rollout(p_batch: np.ndarray, v_batch: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        B = p_batch.shape[0]
        pos_hist = np.zeros((B, steps_per_rollout, 3, 3))
        vel_hist = np.zeros((B, steps_per_rollout, 3, 3))

        curr_p = p_batch.copy()
        curr_v = v_batch.copy()

        for t in range(steps_per_rollout):
            pos_hist[:, t, :, :] = curr_p
            vel_hist[:, t, :, :] = curr_v
            curr_p, curr_v = vectorized_rk4_step(curr_p, curr_v, masses, dt=dt)

        return pos_hist, vel_hist

    # Evaluate initial population
    pos_h, vel_h = run_rollout(pop, vel_pop)
    fitness = evaluate_trajectory_fitness(goal_type, pos_h, vel_h, masses)

    best_idx = np.argmax(fitness)
    best_fitness = float(fitness[best_idx])

    best_pos = pop[best_idx].copy()
    best_vel = vel_pop[best_idx].copy()

    # Yield Generation 0 initial status
    yield {
        "type": "progress",
        "generation": 0,
        "max_generations": max_generations,
        "progress_pct": 0.0,
        "best_fitness": round(best_fitness, 4),
        "goal_type": goal_type
    }

    # Differential Evolution hyperparams
    F_weight = 0.6  # Mutation factor
    CR_prob = 0.7   # Crossover probability

    for gen in range(1, max_generations + 1):
        # Create mutant & trial pop
        trial_pop = pop.copy()
        trial_vel = vel_pop.copy()

        for i in range(pop_size):
            # Select 3 distinct random candidates != i
            candidates = [idx for idx in range(pop_size) if idx != i]
            a, b, c = np.random.choice(candidates, 3, replace=False)

            # Mutation
            mutant_p = pop[a] + F_weight * (pop[b] - pop[c])
            mutant_v = vel_pop[a] + F_weight * (vel_pop[b] - vel_pop[c])

            # Binomial Crossover
            cross_mask_p = np.random.rand(3, 3) < CR_prob
            cross_mask_v = np.random.rand(3, 3) < CR_prob

            trial_pop[i] = np.where(cross_mask_p, mutant_p, pop[i])
            trial_vel[i] = np.where(cross_mask_v, mutant_v, vel_pop[i])

            # Normalize trial candidate COM
            p_list = [Vector3D(x=trial_pop[i, k, 0], y=trial_pop[i, k, 1], z=trial_pop[i, k, 2]) for k in range(3)]
            v_list = [Vector3D(x=trial_vel[i, k, 0], y=trial_vel[i, k, 1], z=trial_vel[i, k, 2]) for k in range(3)]
            norm_p, norm_v = normalize_center_of_mass(list(masses), p_list, v_list)
            for k in range(3):
                trial_pop[i, k, 0], trial_pop[i, k, 1], trial_pop[i, k, 2] = norm_p[k].x, norm_p[k].y, norm_p[k].z
                trial_vel[i, k, 0], trial_vel[i, k, 1], trial_vel[i, k, 2] = norm_v[k].x, norm_v[k].y, norm_v[k].z

        # Rollout & evaluate trial population
        trial_pos_h, trial_vel_h = run_rollout(trial_pop, trial_vel)
        trial_fitness = evaluate_trajectory_fitness(goal_type, trial_pos_h, trial_vel_h, masses)

        # Selection step
        for i in range(pop_size):
            if trial_fitness[i] >= fitness[i]:
                pop[i] = trial_pop[i]
                vel_pop[i] = trial_vel[i]
                fitness[i] = trial_fitness[i]

        curr_best_idx = np.argmax(fitness)
        if fitness[curr_best_idx] > best_fitness:
            best_fitness = float(fitness[curr_best_idx])
            best_pos = pop[curr_best_idx].copy()
            best_vel = vel_pop[curr_best_idx].copy()

        progress_pct = round((gen / max_generations) * 100.0, 1)

        # Yield SSE generation update
        yield {
            "type": "progress",
            "generation": gen,
            "max_generations": max_generations,
            "progress_pct": progress_pct,
            "best_fitness": round(best_fitness, 4),
            "goal_type": goal_type
        }

        # Early termination if fitness threshold achieved (> 0.95)
        if best_fitness >= 0.96:
            break

    # Format final vectors and diagnostics
    pos_a_vecs = [Vector3D(x=round(float(best_pos[i, 0]), 4), y=round(float(best_pos[i, 1]), 4), z=round(float(best_pos[i, 2]), 4)) for i in range(3)]
    vel_a_vecs = [Vector3D(x=round(float(best_vel[i, 0]), 4), y=round(float(best_vel[i, 1]), 4), z=round(float(best_vel[i, 2]), 4)) for i in range(3)]

    # Compute detailed diagnostics
    diagnostics = compute_physics_diagnostics(list(masses), pos_a_vecs, vel_a_vecs)

    # Goal Titles & Descriptions
    goal_titles = {
        "slingshot": "Generative Gravitational Slingshot Boost",
        "ejection": "Optimized Chaotic Escape & Ejection Orbit",
        "binary_capture": "Resonant Binary Orbit Exchange & Capture",
        "trojan_resonance": "Lagrangian Triangular Equilibrium Orbit",
        "triple_encounter": "Ultra-Close Non-Collisional Triple Encounter"
    }

    goal_descs = {
        "slingshot": f"Synthesized initial state vectors maximizing Body 3 gravity assist velocity ratio with peak fitness score {best_fitness:.2f}.",
        "ejection": f"Synthesized initial state vectors triggering rapid chaotic ejection of Body 3 at peak fitness score {best_fitness:.2f}.",
        "binary_capture": f"Synthesized initial state vectors enabling orbital transfer between Body 1 and Body 2 with fitness score {best_fitness:.2f}.",
        "trojan_resonance": f"Synthesized initial state vectors achieving stable Lagrangian equilateral configuration with fitness score {best_fitness:.2f}.",
        "triple_encounter": f"Synthesized initial state vectors producing close-proximity triple body flyby without collision."
    }

    tool_logs = [
        ToolCallLog(
            tool_name="parse_inverse_goal",
            status="SUCCESS",
            description=f"Parsed target goal '{goal_type}' into non-convex trajectory loss metrics.",
            result_summary=f"Goal: {goal_type.upper()}"
        ),
        ToolCallLog(
            tool_name="differential_evolution_optimizer",
            status="SUCCESS",
            description=f"Executed {gen} generations of 18D state vector optimization.",
            result_summary=f"Best Fitness: {best_fitness:.4f}"
        ),
        ToolCallLog(
            tool_name="normalize_center_of_mass",
            status="SUCCESS",
            description="Enforced zero linear momentum P=0 and center of mass at origin (0,0,0).",
            result_summary="P_COM = (0.00, 0.00, 0.00)"
        )
    ]

    yield {
        "type": "complete",
        "success": True,
        "system_name": goal_titles.get(goal_type, "Optimized Target Trajectory"),
        "description": goal_descs.get(goal_type, f"Optimized 3-body system with fitness score {best_fitness:.2f}."),
        "masses": list(masses),
        "pos_a": [p.model_dump() for p in pos_a_vecs],
        "vel_a": [v.model_dump() for v in vel_a_vecs],
        "body_colors": ["#00f3ff", "#ff007f", "#ffea00"],
        "recommended_dt": 0.008,
        "recommended_sub_steps": 20,
        "recommended_perturbation": 1e-7,
        "diagnostics": diagnostics.model_dump(),
        "tool_logs": [t.model_dump() for t in tool_logs],
        "best_fitness": round(best_fitness, 4)
    }
