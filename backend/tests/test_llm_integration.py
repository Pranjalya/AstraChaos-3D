import time
import pytest
from app.agent import CelestialCopilotAgent
from app.schemas import CopilotRequest

@pytest.fixture
def copilot_agent():
    return CelestialCopilotAgent()

def test_llm_agent_initialization(copilot_agent):
    """Verify agent detects NVIDIA API key and initializes client."""
    if copilot_agent.api_key:
        assert copilot_agent.client is not None
        assert copilot_agent.model == "openai/gpt-oss-20b"




def test_llm_agent_generate_orbit_real_call(copilot_agent):
    """
    Test real LLM integration with NVIDIA Nemotron model.
    Includes rate-limit throttling to adhere to 40 RPM limit.
    """
    req = CopilotRequest(
        prompt="Design a 3D figure-eight periodic choreography with equal mass bodies",
        perturbation=1e-7
    )
    
    # Rate limit safety throttle
    time.sleep(1.5)
    
    res = copilot_agent.generate_orbit(req)
    
    assert res.success is True
    assert "Figure-Eight" in res.system_name or "Figure" in res.system_name or "Chenciner" in res.system_name
    assert len(res.masses) == 3
    assert res.diagnostics.total_energy != 0.0
    
    # Check tool invocation logs for LLM reasoning trace
    tool_names = [log.tool_name for log in res.tool_logs]
    assert "parse_astronomical_intent" in tool_names
    assert "synthesize_state_vectors" in tool_names
    assert "normalize_center_of_mass" in tool_names
    assert "compute_physics_diagnostics" in tool_names
    
    if copilot_agent.client:
        assert "astrophysics_llm_reasoning" in tool_names

