import math
import pytest
from app.schemas import Vector3D
from app.tools import (
    normalize_center_of_mass,
    compute_physics_diagnostics,
    synthesize_orbital_topology
)

def test_normalize_center_of_mass_position_and_momentum():
    """Verify that position COM=(0,0,0) and total momentum P=(0,0,0) after normalization."""
    masses = [3.0, 2.0, 1.0]
    pos = [
        Vector3D(x=10.0, y=5.0, z=-2.0),
        Vector3D(x=-4.0, y=1.0, z=8.0),
        Vector3D(x=2.0, y=-3.0, z=1.0)
    ]
    vel = [
        Vector3D(x=1.5, y=-0.5, z=0.2),
        Vector3D(x=-2.0, y=3.0, z=-1.0),
        Vector3D(x=0.5, y=-1.0, z=2.0)
    ]

    norm_pos, norm_vel = normalize_center_of_mass(masses, pos, vel)

    total_mass = sum(masses)
    com_x = sum(m * p.x for m, p in zip(masses, norm_pos)) / total_mass
    com_y = sum(m * p.y for m, p in zip(masses, norm_pos)) / total_mass
    com_z = sum(m * p.z for m, p in zip(masses, norm_pos)) / total_mass

    # Assert COM position is at origin (0,0,0)
    assert abs(com_x) < 1e-10
    assert abs(com_y) < 1e-10
    assert abs(com_z) < 1e-10

    p_x = sum(m * v.x for m, v in zip(masses, norm_vel))
    p_y = sum(m * v.y for m, v in zip(masses, norm_vel))
    p_z = sum(m * v.z for m, v in zip(masses, norm_vel))

    # Assert total momentum P is (0,0,0)
    assert abs(p_x) < 1e-10
    assert abs(p_y) < 1e-10
    assert abs(p_z) < 1e-10


def test_compute_physics_diagnostics():
    """Test kinetic energy, potential energy, total energy, and chaos horizon math."""
    masses = [1.0, 1.0, 1.0]
    pos = [
        Vector3D(x=-1.0, y=0.0, z=0.0),
        Vector3D(x=1.0, y=0.0, z=0.0),
        Vector3D(x=0.0, y=1.0, z=0.0)
    ]
    vel = [
        Vector3D(x=0.0, y=0.5, z=0.0),
        Vector3D(x=0.0, y=-0.5, z=0.0),
        Vector3D(x=0.0, y=0.0, z=0.0)
    ]

    diag = compute_physics_diagnostics(masses, pos, vel, perturbation=1e-7)

    # T = 0.5 * (1.0*0.25 + 1.0*0.25 + 0) = 0.25
    assert diag.kinetic_energy == pytest.approx(0.25, abs=0.05)
    assert diag.potential_energy < 0.0
    assert diag.total_energy == pytest.approx(diag.kinetic_energy + diag.potential_energy, abs=1e-3)
    assert diag.angular_momentum >= 0.0
    assert diag.chaos_horizon_time > 0.0
    assert isinstance(diag.stability_classification, str)


@pytest.mark.parametrize("prompt,expected_keyword", [
    ("create a binary star with a rogue planet", "Binary Star"),
    ("generate a figure 8 orbit", "Figure-Eight"),
    ("pythagorean triple collision system", "Pythagorean"),
    ("solar system sun jupiter moon", "Hierarchical"),
    ("unknown generic chaotic system prompt", "AI Synthesized Chaotic Triad")
])
def test_synthesize_orbital_topology_archetypes(prompt, expected_keyword):
    """Test that prompt keyword parsing selects the correct celestial archetype."""
    res = synthesize_orbital_topology(prompt, perturbation=1e-7)
    
    assert expected_keyword in res["system_name"]
    assert len(res["body_colors"]) == 3
    assert len(res["tool_logs"]) >= 3


def test_synthesize_orbital_topology_dynamic_custom_parameters():
    """Test dynamic parameter overrides (custom masses, spatial scale, velocity multiplier)."""
    custom = {
        "custom_masses": [6.5, 1.5, 0.05],
        "spatial_scale": 2.0,
        "velocity_multiplier": 1.5
    }
    res = synthesize_orbital_topology("custom prompt", perturbation=1e-7, custom_params=custom)
    
    assert res["masses"] == [6.5, 1.5, 0.05]
    tool_names = [log.tool_name for log in res["tool_logs"]]
    assert "extract_dynamic_parameters" in tool_names

