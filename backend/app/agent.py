import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from app.schemas import CopilotRequest, CopilotResponse, PhysicsDiagnostics, ToolCallLog, Vector3D
from app.tools import synthesize_orbital_topology, compute_physics_diagnostics, normalize_center_of_mass

load_dotenv()

class CelestialCopilotAgent:
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.model = "z-ai/glm-5.2" # nvidia/nemotron-3-nano-30b-a3b
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=self.api_key
                )
            except Exception as e:
                print(f"[Agent Warning] OpenAI client initialization error: {e}")

    def generate_orbit(self, request: CopilotRequest) -> CopilotResponse:
        """
        Orchestrates LLM intent analysis, tool calls, physics calculations, 
        and returns a complete CopilotResponse payload.
        """
        # 1. Base synthesis via orbital mechanics tool
        topology = synthesize_orbital_topology(request.prompt, request.perturbation)
        
        # 2. If NVIDIA API key is available, enhance with Nemotron LLM insights
        llm_enhanced_desc = topology["description"]
        llm_system_name = topology["system_name"]

        if self.client:
            try:
                prompt_messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are AstraChaos Agentic Celestial Copilot, an expert AI astrophysics engine. "
                            "Analyze the user's prompt about three-body gravitational dynamics and provide a concise, "
                            "compelling 2-sentence astrophysics breakdown describing the system dynamics, chaos horizon, "
                            "and gravitational resonance."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"User Prompt: '{request.prompt}'. System Type: '{topology['system_name']}'. Mass Ratio: {topology['masses']}."
                    }
                ]
                
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=prompt_messages,
                    temperature=0.7,
                    max_tokens=300,
                    timeout=8.0
                )

                
                if completion.choices and completion.choices[0].message.content:
                    llm_enhanced_desc = completion.choices[0].message.content.strip()
                    
                topology["tool_logs"].append(
                    ToolCallLog(
                        tool_name="nvidia_nemotron_llm_reasoning",
                        status="SUCCESS",
                        description=f"Invoiced NVIDIA Nemotron ({self.model}) for agentic astrophysics reasoning",
                        result_summary=f"Synthesized astrophysicist report: '{llm_enhanced_desc[:60]}...'"
                    )
                )
            except Exception as e:
                topology["tool_logs"].append(
                    ToolCallLog(
                        tool_name="nvidia_nemotron_llm_reasoning",
                        status="FALLBACK",
                        description=f"LLM API call fallback: {str(e)[:40]}",
                        result_summary="Utilized local deterministic astronomical generator"
                    )
                )

        return CopilotResponse(
            success=True,
            system_name=llm_system_name,
            description=llm_enhanced_desc,
            masses=topology["masses"],
            pos_a=topology["pos_a"],
            vel_a=topology["vel_a"],
            body_colors=topology["body_colors"],
            recommended_dt=0.008,
            recommended_sub_steps=20,
            recommended_perturbation=request.perturbation,
            diagnostics=topology["diagnostics"],
            tool_logs=topology["tool_logs"]
        )
