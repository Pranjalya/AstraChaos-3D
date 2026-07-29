import os
import re
import json
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from openai import OpenAI
from app.schemas import CopilotRequest, CopilotResponse, PhysicsDiagnostics, ToolCallLog, Vector3D
from app.tools import synthesize_orbital_topology, compute_physics_diagnostics, normalize_center_of_mass

load_dotenv()

class CelestialCopilotAgent:
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.model = "openai/gpt-oss-20b"
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=self.api_key
                )
            except Exception as e:
                print(f"[Agent Warning] OpenAI client initialization error: {e}")

    def detect_inverse_goal_intent(self, prompt: str) -> Optional[str]:
        """
        Evaluates whether a natural language user query describes an inverse optimization goal.
        Returns the goal_type string ('slingshot', 'ejection', 'binary_capture', 'trojan_resonance', 'triple_encounter') or 'slingshot'.
        """
        p = prompt.lower()
        if any(kw in p for kw in ["slingshot", "gravity assist", "velocity boost", "speed boost", "accelerate", "fast", "boost"]):
            return "slingshot"
        if any(kw in p for kw in ["eject", "escape", "fly away", "unbound", "ejection", "scatter", "leave"]):
            return "ejection"
        if any(kw in p for kw in ["binary capture", "orbital transfer", "switch orbit", "exchange", "transfer", "orbit body 2"]):
            return "binary_capture"
        if any(kw in p for kw in ["trojan", "lagrange", "equilateral", "triangular", "l4", "l5", "stable", "equilibrium"]):
            return "trojan_resonance"
        if any(kw in p for kw in ["triple encounter", "close flyby", "non-collisional", "triple close", "encounter", "collision"]):
            return "triple_encounter"
        return "slingshot" # Default intelligent fallback target


    def generate_orbit(self, request: CopilotRequest) -> CopilotResponse:
        """
        Orchestrates LLM dynamic tool parameter parsing, orbital synthesis, 
        physics calculations, and returns a complete CopilotResponse payload.
        """
        custom_params = None
        llm_enhanced_desc = None
        llm_success = False

        # 1. Attempt dynamic LLM parameter extraction via openai/gpt-oss-20b
        if self.client:
            try:
                sys_msg = (
                    "You are AstraChaos Agentic Physics Tool Call Parser. "
                    "Extract custom physical parameters and astrophysics summary from user query into JSON:\n"
                    "{\n"
                    '  "custom_masses": [m1, m2, m3] or null,\n'
                    '  "spatial_scale": float or 1.0,\n'
                    '  "velocity_multiplier": float or 1.0,\n'
                    '  "astrophysics_summary": "2-sentence astrophysics breakdown of system dynamics and chaos horizon"\n'
                    "}\n"
                    "Output ONLY valid raw JSON."
                )

                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": sys_msg},
                        {"role": "user", "content": request.prompt}
                    ],
                    temperature=0.1,
                    max_tokens=250,
                    timeout=10.0
                )

                if completion.choices and completion.choices[0].message.content:
                    raw_text = completion.choices[0].message.content.strip()
                    llm_success = True
                    
                    # Robust JSON extraction using regex matching for {...}
                    match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                    if match:
                        try:
                            parsed = json.loads(match.group(0))
                            custom_params = parsed
                            if "astrophysics_summary" in parsed and parsed["astrophysics_summary"]:
                                llm_enhanced_desc = str(parsed["astrophysics_summary"]).strip()
                        except Exception as parse_err:
                            print(f"[Copilot JSON Parse Warning]: {parse_err}")
                            llm_enhanced_desc = raw_text.replace("<json>", "").replace("</json>", "").strip()
                    else:
                        llm_enhanced_desc = raw_text

            except Exception as e:
                print(f"[Copilot LLM Parse Warning]: {e}")

        # 2. Base synthesis via orbital mechanics tool (with optional dynamic parameters)
        topology = synthesize_orbital_topology(request.prompt, request.perturbation, custom_params=custom_params)

        if not llm_enhanced_desc:
            llm_enhanced_desc = topology["description"]
        llm_system_name = topology["system_name"]

        # Append LLM reasoning trace log
        if llm_success:
            topology["tool_logs"].append(
                ToolCallLog(
                    tool_name="astrophysics_llm_reasoning",
                    status="SUCCESS",
                    description=f"Invoiced NVIDIA API ({self.model}) for agentic parameter extraction & astrophysics reasoning",
                    result_summary=f"Synthesized report: '{llm_enhanced_desc[:65]}...'"
                )
            )
        else:
            topology["tool_logs"].append(
                ToolCallLog(
                    tool_name="astrophysics_llm_reasoning",
                    status="SUCCESS",
                    description="Executed deterministic celestial mechanics physics engine",
                    result_summary="Generated orbital state vectors, energy diagnostics, and chaos horizon metrics"
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
