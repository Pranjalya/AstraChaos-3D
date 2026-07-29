import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
from dotenv import load_dotenv
import json

from app.schemas import CopilotRequest, CopilotResponse, PhysicsDiagnostics
from app.agent import CelestialCopilotAgent
from app.tools import compute_physics_diagnostics
from app.inverse_optimizer import generate_inverse_optimization_stream

load_dotenv()

app = FastAPI(
    title="AstraChaos 3D — Agentic Physics Copilot API",
    description="Python FastAPI backend powering natural language orbit synthesis, LLM tool orchestration, SSE inverse trajectory optimization, and chaos diagnostics via NVIDIA Nemotron.",
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

@app.get("/api/copilot/optimize_inverse/stream")
def stream_inverse_optimization(
    goal_type: str = "slingshot",
    custom_prompt: Optional[str] = None,
    max_generations: int = 40,
    pop_size: int = 32
):
    """
    Streams real-time Server-Sent Events (SSE) for 18D state vector optimization progress.
    Yields per-generation progress JSON followed by final state payload.
    """
    try:
        effective_goal = goal_type
        if custom_prompt and custom_prompt.strip():
            detected = copilot_agent.detect_inverse_goal_intent(custom_prompt)
            if detected:
                effective_goal = detected

        def sse_event_generator():
            stream_gen = generate_inverse_optimization_stream(
                goal_type=effective_goal,
                custom_prompt=custom_prompt,
                max_generations=max_generations,
                pop_size=pop_size
            )
            for item in stream_gen:
                json_data = json.dumps(item)
                yield f"data: {json_data}\n\n"


        return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inverse optimization streaming failed: {str(e)}")

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

