import math
import numpy as np
from typing import List, Tuple, Dict, Any
from app.schemas import Vector3D, PhysicsDiagnostics, ToolCallLog

def normalize_center_of_mass(
    masses: List[float], 
    pos: List[Vector3D], 
    vel: List[Vector3D]
) -> Tuple[List[Vector3D], List[Vector3D]]:
    """
    Normalizes positions and velocities so that:
    1. Center of Mass (COM) position is at the origin (0, 0, 0)
    2. Total system linear momentum P = sum(m_i * v_i) = (0, 0, 0)
    This ensures the 3D scene stays centered in the WebGL viewport.
    """
    total_mass = sum(masses)
    if total_mass == 0:
        return pos, vel

    # COM Position
    cx = sum(m * p.x for m, p in zip(masses, pos)) / total_mass
    cy = sum(m * p.y for m, p in zip(masses, pos)) / total_mass
    cz = sum(m * p.z for m, p in zip(masses, pos)) / total_mass

    # COM Velocity (Linear Momentum / Total Mass)
    vx = sum(m * v.x for m, v in zip(masses, vel)) / total_mass
    vy = sum(m * v.y for m, v in zip(masses, vel)) / total_mass
    vz = sum(m * v.z for m, v in zip(masses, vel)) / total_mass

    norm_pos = [Vector3D(x=p.x - cx, y=p.y - cy, z=p.z - cz) for p in pos]
    norm_vel = [Vector3D(x=v.x - vx, y=v.y - vy, z=v.z - vz) for v in vel]

    return norm_pos, norm_vel


def compute_physics_diagnostics(
    masses: List[float],
    pos: List[Any],
    vel: List[Any],
    perturbation: float = 1e-7,
    G: float = 1.0,
    softening: float = 0.01
) -> PhysicsDiagnostics:
    """
    Computes kinetic energy T, potential energy V, total energy E, 
    angular momentum vector |L|, and chaos horizon time.
    """
    pos_vecs = [Vector3D(**p) if isinstance(p, dict) else p for p in pos]
    vel_vecs = [Vector3D(**v) if isinstance(v, dict) else v for v in vel]

    # 1. Kinetic Energy T = 0.5 * sum(m_i * v_i^2)
    T = 0.5 * sum(m * (v.x**2 + v.y**2 + v.z**2) for m, v in zip(masses, vel_vecs))

    # 2. Potential Energy V = - sum_{i < j} (G * m_i * m_j / sqrt(r_{ij}^2 + eps^2))
    V = 0.0
    num_bodies = len(masses)
    for i in range(num_bodies):
        for j in range(i + 1, num_bodies):
            dx = pos_vecs[i].x - pos_vecs[j].x
            dy = pos_vecs[i].y - pos_vecs[j].y
            dz = pos_vecs[i].z - pos_vecs[j].z
            dist_sq = dx**2 + dy**2 + dz**2 + softening**2
            dist = math.sqrt(dist_sq)
            V -= (G * masses[i] * masses[j]) / dist

    total_energy = T + V

    # 3. Angular Momentum L = sum(m_i * (r_i x v_i))
    Lx, Ly, Lz = 0.0, 0.0, 0.0
    for m, p, v in zip(masses, pos_vecs, vel_vecs):
        Lx += m * (p.y * v.z - p.z * v.y)
        Ly += m * (p.z * v.x - p.x * v.z)
        Lz += m * (p.x * v.y - p.y * v.x)
    
    angular_momentum = math.sqrt(Lx**2 + Ly**2 + Lz**2)


    # 4. Chaos Horizon & Lyapunov estimation
    # Smaller perturbation delta means longer time before separation horizon
    delta = max(perturbation, 1e-12)
    # Estimate Lyapunov exponent lambda based on energy dispersion
    lyapunov_est = max(0.2, math.sqrt(abs(total_energy) + 0.1) * 0.8)
    chaos_horizon = math.log(1.0 / delta) / lyapunov_est

    # Stability classification
    if abs(total_energy) < 0.05:
        stability = "Hyper-Unstable / Unbound Scatter"
    elif T / (abs(V) + 1e-6) > 0.8:
        stability = "High Kinetic Chaos / Ejection Risk"
    elif angular_momentum > 1.2:
        stability = "Quasi-Stable Resonant Orbit"
    else:
        stability = "Determinist Chaos Horizon"

    return PhysicsDiagnostics(
        total_energy=round(total_energy, 4),
        kinetic_energy=round(T, 4),
        potential_energy=round(V, 4),
        angular_momentum=round(angular_momentum, 4),
        chaos_horizon_time=round(chaos_horizon, 2),
        stability_classification=stability
    )


def synthesize_orbital_topology(
    prompt: str,
    perturbation: float = 1e-7
) -> Dict[str, Any]:
    """
    Parses user prompt keywords to generate celestial state vectors, 
    masses, and visual themes.
    """
    prompt_lower = prompt.lower()
    
    tool_logs: List[ToolCallLog] = [
        ToolCallLog(
            tool_name="parse_astronomical_intent",
            status="SUCCESS",
            description="Analyzed natural language prompt for celestial mechanics patterns",
            result_summary=f"Matched astronomical intent from prompt: '{prompt[:45]}...'"
        )
    ]

    # Archetype 1: Binary Star + Planet / Horseshoe / Rogue
    if any(k in prompt_lower for k in ["horseshoe", "rogue"]):
        system_name = "Binary Star & Rogue Companion System"
        description = "A massive binary star pair (m1=2.5, m2=2.0) orbited by a lightweight companion planet (m3=0.1) in an unstable retrograde horseshoe path."
        masses = [2.5, 2.0, 0.1]
        body_colors = ["#ffaa00", "#ff3300", "#00f3ff"]
        
        pos = [
            Vector3D(x=-0.8, y=0.0, z=0.0),
            Vector3D(x=0.8, y=0.0, z=0.0),
            Vector3D(x=0.0, y=2.2, z=0.4)
        ]
        vel = [
            Vector3D(x=0.0, y=-0.6, z=0.0),
            Vector3D(x=0.0, y=0.75, z=0.0),
            Vector3D(x=-1.1, y=0.0, z=0.15)
        ]

    # Archetype 2: Figure-Eight Periodic Choreography
    elif any(k in prompt_lower for k in ["eight", "figure 8", "figure-eight", "choreography", "chenciner"]):
        system_name = "Chenciner 3D Figure-Eight Choreography"
        description = "Three equal-mass bodies pursuing a famous periodic figure-eight trajectory discovered by Chenciner & Montgomery."
        masses = [1.0, 1.0, 1.0]
        body_colors = ["#00f3ff", "#ff007f", "#ffee00"]
        
        x1, y1 = -0.97000436, 0.24308753
        vx3, vy3 = -2 * -0.46443701, -2 * -0.39606013
        
        pos = [
            Vector3D(x=x1, y=y1, z=0.0),
            Vector3D(x=-x1, y=-y1, z=0.0),
            Vector3D(x=0.0, y=0.0, z=0.0)
        ]
        vel = [
            Vector3D(x=vx3/2, y=vy3/2, z=0.1),
            Vector3D(x=vx3/2, y=vy3/2, z=-0.1),
            Vector3D(x=-vx3, y=-vy3, z=0.0)
        ]

    # Archetype 3: Pythagorean Triple Collision (Burrau)
    elif any(k in prompt_lower for k in ["pythagorean", "collision", "burrau", "scat", "triple collision"]):
        system_name = "Pythagorean Triple Collision (Burrau's Problem)"
        description = "Three bodies at the vertices of a 3:4:5 right-angled triangle (masses 3, 4, 5) experiencing explosive gravitational scattering."
        masses = [3.0, 4.0, 5.0]
        body_colors = ["#ff0055", "#00ffaa", "#7000ff"]
        
        pos = [
            Vector3D(x=1.0, y=3.0, z=0.0),
            Vector3D(x=-2.0, y=-1.0, z=0.2),
            Vector3D(x=1.0, y=-1.0, z=-0.2)
        ]
        vel = [
            Vector3D(x=0.0, y=0.0, z=0.0),
            Vector3D(x=0.0, y=0.0, z=0.0),
            Vector3D(x=0.0, y=0.0, z=0.0)
        ]

    # Archetype 4: Hierarchical Triple System (Sun-Jupiter-Moon)
    elif any(k in prompt_lower for k in ["hierarch", "solar", "moon", "orbit", "planet"]):
        system_name = "Hierarchical Triple Gravitational System"
        description = "A massive central star (m1=5.0) orbited by a planet (m2=0.5), which is in turn orbited by a tiny moon (m3=0.02)."
        masses = [5.0, 0.5, 0.02]
        body_colors = ["#ffcc00", "#00bbff", "#ffffff"]
        
        pos = [
            Vector3D(x=0.0, y=0.0, z=0.0),
            Vector3D(x=2.5, y=0.0, z=0.0),
            Vector3D(x=2.8, y=0.0, z=0.1)
        ]
        vel = [
            Vector3D(x=0.0, y=-0.1, z=0.0),
            Vector3D(x=0.0, y=1.4, z=0.0),
            Vector3D(x=0.0, y=2.2, z=0.3)
        ]

    # Archetype 5: Hyperbolic Slingshot Interloper
    elif any(k in prompt_lower for k in ["slingshot", "flyby", "hyperbolic", "interloper"]):
        system_name = "Hyperbolic Slingshot & Rogue Interloper"
        description = "A high-velocity rogue body (m3=0.8) plunging past a central binary system on a hyperbolic trajectory, triggering wild orbital perturbations."
        masses = [3.0, 2.5, 0.8]
        body_colors = ["#ffaa00", "#00f3ff", "#ff007f"]
        
        pos = [
            Vector3D(x=-1.0, y=0.0, z=0.0),
            Vector3D(x=1.0, y=0.0, z=0.0),
            Vector3D(x=-5.0, y=4.0, z=1.5)
        ]
        vel = [
            Vector3D(x=0.0, y=-0.8, z=0.0),
            Vector3D(x=0.0, y=0.96, z=0.0),
            Vector3D(x=1.8, y=-1.4, z=-0.3)
        ]

    # Archetype 6: Lagrange L4/L5 Trojan Resonance
    elif any(k in prompt_lower for k in ["trojan", "lagrange", "l4", "l5", "resonance"]):
        system_name = "Lagrange L4 Trojan Triad System"
        description = "A massive star (m1=10.0), secondary companion (m2=1.0), and a lightweight asteroid (m3=0.01) librating near the stable 60° L4 Lagrange point."
        masses = [10.0, 1.0, 0.01]
        body_colors = ["#ffee00", "#3b82f6", "#10b981"]
        
        pos = [
            Vector3D(x=0.0, y=0.0, z=0.0),
            Vector3D(x=4.0, y=0.0, z=0.0),
            Vector3D(x=2.0, y=3.464, z=0.2)
        ]
        vel = [
            Vector3D(x=0.0, y=-0.15, z=0.0),
            Vector3D(x=0.0, y=1.5, z=0.0),
            Vector3D(x=-1.3, y=0.75, z=0.05)
        ]

    # Archetype 7: Tidal Disruption & Mass Ejection
    elif any(k in prompt_lower for k in ["ejection", "disruption", "tidal", "scatter"]):
        system_name = "Tidal Disruption & Escape Ejection System"
        description = "An unstable close encounter between three massive stars resulting in the violent escape ejection of Body 3 at hyperbolic velocity."
        masses = [4.0, 3.5, 1.2]
        body_colors = ["#ff0055", "#a855f7", "#00e676"]
        
        pos = [
            Vector3D(x=-0.5, y=-0.5, z=0.0),
            Vector3D(x=0.5, y=0.5, z=0.1),
            Vector3D(x=0.1, y=-0.2, z=-0.1)
        ]
        vel = [
            Vector3D(x=0.4, y=-0.4, z=0.1),
            Vector3D(x=-0.4, y=0.4, z=-0.1),
            Vector3D(x=1.2, y=1.5, z=0.5)
        ]

    # Archetype 8: Default Parametric Chaotic System
    else:
        system_name = "AI Synthesized Chaotic Triad"
        description = f"Custom multi-body gravitational potential field synthesized from user prompt: '{prompt}'."
        masses = [1.8, 1.2, 0.9]
        body_colors = ["#ff00ff", "#00f3ff", "#ffaa00"]
        
        pos = [
            Vector3D(x=-1.2, y=0.5, z=0.3),
            Vector3D(x=1.0, y=-0.8, z=-0.2),
            Vector3D(x=0.2, y=1.1, z=-0.1)
        ]
        vel = [
            Vector3D(x=0.2, y=-0.7, z=0.1),
            Vector3D(x=-0.5, y=0.6, z=-0.2),
            Vector3D(x=0.3, y=0.1, z=0.1)
        ]


    # Tool Call 2: Normalize Center of Mass & Momentum
    tool_logs.append(
        ToolCallLog(
            tool_name="synthesize_state_vectors",
            status="SUCCESS",
            description="Generated initial position (r) and velocity (v) vectors for 3 bodies",
            result_summary=f"Synthesized state vectors for '{system_name}' with mass ratio {masses[0]}:{masses[1]}:{masses[2]}"
        )
    )

    pos_norm, vel_norm = normalize_center_of_mass(masses, pos, vel)
    
    tool_logs.append(
        ToolCallLog(
            tool_name="normalize_center_of_mass",
            status="SUCCESS",
            description="Shifted system so Center of Mass COM=(0,0,0) and total momentum P=0",
            result_summary="COM momentum cancellation complete. Prevents scene drift in WebGL viewport."
        )
    )

    # Tool Call 3: Physics Diagnostics
    diagnostics = compute_physics_diagnostics(masses, pos_norm, vel_norm, perturbation)

    tool_logs.append(
        ToolCallLog(
            tool_name="compute_physics_diagnostics",
            status="SUCCESS",
            description="Calculated Hamiltonian Total Energy (E=T+V), Angular Momentum (|L|), and Chaos Horizon",
            result_summary=f"E={diagnostics.total_energy} J | |L|={diagnostics.angular_momentum} | Chaos Horizon={diagnostics.chaos_horizon_time} time units"
        )
    )

    return {
        "system_name": system_name,
        "description": description,
        "masses": masses,
        "pos_a": pos_norm,
        "vel_a": vel_norm,
        "body_colors": body_colors,
        "diagnostics": diagnostics,
        "tool_logs": tool_logs
    }
