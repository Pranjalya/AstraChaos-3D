import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.schemas import CopilotRequest, CopilotResponse, PhysicsDiagnostics, SlingshotPlanRequest, SlingshotPlanResponse
from app.agent import CelestialCopilotAgent
from app.tools import compute_physics_diagnostics, plan_slingshot_trajectory_tool

load_dotenv()

app = FastAPI(
    title="AstraChaos 3D — Agentic Physics Copilot API",
    description="Python FastAPI backend powering natural language orbit synthesis, LLM tool orchestration, and chaos diagnostics via NVIDIA Nemotron.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev and production client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Copilot Agent
copilot_agent = CelestialCopilotAgent()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AstraChaos 3D Agentic Backend",
        "nvidia_llm_connected": copilot_agent.client is not None,
        "model": copilot_agent.model
    }

@app.post("/api/copilot/generate", response_model=CopilotResponse)
def generate_orbit(request: CopilotRequest):
    try:
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt must not be empty.")
        
        response = copilot_agent.generate_orbit(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot generation failed: {str(e)}")

@app.post("/api/copilot/diagnostics", response_model=PhysicsDiagnostics)
def evaluate_diagnostics(payload: dict):
    try:
        masses = payload.get("masses", [1.0, 1.0, 1.0])
        pos = payload.get("pos", [])
        vel = payload.get("vel", [])
        perturbation = payload.get("perturbation", 1e-7)
        
        diagnostics = compute_physics_diagnostics(masses, pos, vel, perturbation)
        return diagnostics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostics calculation failed: {str(e)}")

@app.post("/api/copilot/slingshot", response_model=SlingshotPlanResponse)
def compute_slingshot_plan(request: SlingshotPlanRequest):
    try:
        masses = request.custom_masses or [1.0, 1.0, 1.0]
        if request.custom_pos_a and request.custom_vel_a:
            pos_a = request.custom_pos_a
            vel_a = request.custom_vel_a
        else:
            # Fallback default figure-eight orbit positions
            pos_a = [
                {"x": -0.97000436, "y": 0.24308753, "z": 0.0},
                {"x": 0.97000436, "y": -0.24308753, "z": 0.0},
                {"x": 0.0, "y": 0.0, "z": 0.0}
            ]
            vel_a = [
                {"x": 0.46620531, "y": 0.43236573, "z": 0.0},
                {"x": 0.46620531, "y": 0.43236573, "z": 0.0},
                {"x": -0.93241062, "y": -0.86473146, "z": 0.0}
            ]
        
        from app.schemas import Vector3D
        pos_vecs = [p if isinstance(p, Vector3D) else Vector3D(**p) for p in pos_a]
        vel_vecs = [v if isinstance(v, Vector3D) else Vector3D(**v) for v in vel_a]

        plan_data = plan_slingshot_trajectory_tool(
            masses=masses,
            pos_a=pos_vecs,
            vel_a=vel_vecs,
            target_body_idx=request.target_body_index,
            max_delta_v=request.max_delta_v
        )
        return SlingshotPlanResponse(
            success=True,
            **plan_data
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Slingshot trajectory planning failed: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

