import pytest
from app.inverse_optimizer import (
    generate_inverse_optimization_stream,
    evaluate_trajectory_fitness
)

def test_inverse_optimization_stream_generation():
    """Verify that the inverse optimization stream yields progress events and a complete final payload."""
    stream = generate_inverse_optimization_stream(
        goal_type="slingshot",
        pop_size=12,
        max_generations=5,
        steps_per_rollout=100
    )

    events = list(stream)
    assert len(events) >= 2, "Expected at least generation 0 progress event and final complete payload."

    # Check first progress event
    first_event = events[0]
    assert first_event["type"] == "progress"
    assert first_event["generation"] == 0
    assert first_event["goal_type"] == "slingshot"
    assert "best_fitness" in first_event

    # Check final complete payload event
    final_event = events[-1]
    assert final_event["type"] == "complete"
    assert final_event["success"] is True
    assert len(final_event["masses"]) == 3
    assert len(final_event["pos_a"]) == 3
    assert len(final_event["vel_a"]) == 3
    assert final_event["best_fitness"] > 0.0
    assert "diagnostics" in final_event
    assert "tool_logs" in final_event


@pytest.mark.parametrize("goal", ["slingshot", "ejection", "binary_capture", "trojan_resonance", "triple_encounter"])
def test_inverse_optimization_all_preset_goals(goal):
    """Verify that optimization completes for all 5 preset objective chips."""
    stream = generate_inverse_optimization_stream(
        goal_type=goal,
        pop_size=10,
        max_generations=3,
        steps_per_rollout=50
    )

    events = list(stream)
    final_event = events[-1]

    assert final_event["type"] == "complete"
    assert final_event["success"] is True
    assert final_event["best_fitness"] >= 0.0
