import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    """Test GET /api/health endpoint returns 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "nvidia_llm_connected" in data
    assert "model" in data


def test_copilot_diagnostics_endpoint():
    """Test POST /api/copilot/diagnostics calculates physics metrics."""
    payload = {
        "masses": [1.0, 1.0, 1.0],
        "pos": [
            {"x": -1.0, "y": 0.0, "z": 0.0},
            {"x": 1.0, "y": 0.0, "z": 0.0},
            {"x": 0.0, "y": 1.0, "z": 0.0}
        ],
        "vel": [
            {"x": 0.0, "y": 0.5, "z": 0.0},
            {"x": 0.0, "y": -0.5, "z": 0.0},
            {"x": 0.0, "y": 0.0, "z": 0.0}
        ],
        "perturbation": 1e-7
    }
    response = client.post("/api/copilot/diagnostics", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_energy" in data
    assert "kinetic_energy" in data
    assert "potential_energy" in data
    assert "angular_momentum" in data
    assert "chaos_horizon_time" in data
    assert "stability_classification" in data


def test_generate_orbit_empty_prompt_validation():
    """Test POST /api/copilot/generate returns 400 when prompt is empty or whitespace."""
    response = client.post("/api/copilot/generate", json={"prompt": "   "})
    assert response.status_code == 400
    assert "Prompt must not be empty" in response.json()["detail"]


def test_generate_orbit_valid_request():
    """Test POST /api/copilot/generate returns a complete CopilotResponse payload."""
    payload = {
        "prompt": "Create a heavy binary star pair orbited by a lightweight companion planet",
        "perturbation": 1e-7
    }
    response = client.post("/api/copilot/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "system_name" in data
    assert "description" in data
    assert len(data["masses"]) == 3
    assert len(data["pos_a"]) == 3
    assert len(data["vel_a"]) == 3
    assert len(data["body_colors"]) == 3
    assert "diagnostics" in data
    assert len(data["tool_logs"]) >= 3
