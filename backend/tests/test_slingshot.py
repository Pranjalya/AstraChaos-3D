from fastapi.testclient import TestClient
from app.main import app
from app.rl_optimizer import SpacecraftSlingshotOptimizer
from app.schemas import Vector3D

client = TestClient(app)

def test_slingshot_optimizer_direct():
    masses = [1.0, 1.0, 1.0]
    pos_a = [
        Vector3D(x=-0.97, y=0.24, z=0.0),
        Vector3D(x=0.97, y=-0.24, z=0.0),
        Vector3D(x=0.0, y=0.0, z=0.0)
    ]
    vel_a = [
        Vector3D(x=0.46, y=0.43, z=0.0),
        Vector3D(x=0.46, y=0.43, z=0.0),
        Vector3D(x=-0.93, y=-0.86, z=0.0)
    ]
    optimizer = SpacecraftSlingshotOptimizer(masses, pos_a, vel_a)
    result = optimizer.optimize(target_body_idx=1, max_delta_v=1.5)

    assert "probe_start_pos" in result
    assert "probe_start_vel" in result
    assert "fuel_saved_percentage" in result
    assert len(result["trajectory_points"]) > 0

def test_slingshot_api_endpoint():
    payload = {
        "preset_name": "figureEight",
        "target_body_index": 1,
        "max_delta_v": 1.5
    }
    response = client.post("/api/copilot/slingshot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["target_body_index"] == 1
    assert "burn_events" in data
