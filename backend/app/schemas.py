from typing import List, Optional
from pydantic import BaseModel, Field

class Vector3D(BaseModel):
    x: float
    y: float
    z: float

class PhysicsDiagnostics(BaseModel):
    total_energy: float = Field(..., description="Total mechanical energy E = T + V")
    kinetic_energy: float = Field(..., description="Kinetic energy T")
    potential_energy: float = Field(..., description="Gravitational potential energy V")
    angular_momentum: float = Field(..., description="Magnitude of total angular momentum vector |L|")
    chaos_horizon_time: float = Field(..., description="Estimated time units before exponential divergence")
    stability_classification: str = Field(..., description="System classification e.g. Quasi-Periodic, Highly Chaotic, Escape/Scatter")

class ToolCallLog(BaseModel):
    tool_name: str
    status: str
    description: str
    result_summary: str

class CopilotRequest(BaseModel):
    prompt: str = Field(..., description="User natural language prompt describing desired celestial system")
    perturbation: Optional[float] = Field(default=1e-7, description="Desired quantum perturbation scale")

class CopilotResponse(BaseModel):
    success: bool
    system_name: str
    description: str
    masses: List[float] = Field(..., description="Masses for Body 1, 2, 3")
    pos_a: List[Vector3D] = Field(..., description="Initial positions for Body 1, 2, 3 in Universe A")
    vel_a: List[Vector3D] = Field(..., description="Initial velocities for Body 1, 2, 3 in Universe A")
    body_colors: List[str] = Field(..., description="Hex colors for Body 1, 2, 3")
    recommended_dt: float = Field(default=0.008, description="Integrator timestep")
    recommended_sub_steps: int = Field(default=20, description="WASM substeps per frame")
    recommended_perturbation: float = Field(default=1e-7, description="Perturbation scale")
    diagnostics: PhysicsDiagnostics
    tool_logs: List[ToolCallLog]

class InverseOptimizationRequest(BaseModel):
    goal_type: str = Field(default="slingshot", description="Target objective chip e.g. slingshot, ejection, binary_capture, trojan_resonance, triple_encounter")
    max_generations: Optional[int] = Field(default=40, description="Max optimization generations")
    pop_size: Optional[int] = Field(default=32, description="Population size per generation")

class InverseOptimizationProgress(BaseModel):
    type: str = Field(..., description="Progress event type: 'progress' or 'complete'")
    generation: int
    max_generations: int
    progress_pct: float
    best_fitness: float
    goal_type: str

