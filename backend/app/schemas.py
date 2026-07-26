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

class BurnEvent(BaseModel):

    time: float = Field(..., description="Simulation time step when impulse burn is executed")
    delta_v: Vector3D = Field(..., description="Impulse velocity vector (dv_x, dv_y, dv_z)")
    fuel_used: float = Field(..., description="Magnitude of delta-v consumed")
    description: str = Field(..., description="Human-readable description of maneuver e.g. Slingshot Correction Burn")

class SlingshotPlanRequest(BaseModel):
    preset_name: Optional[str] = Field(default="figureEight", description="Base orbit preset name")
    target_body_index: int = Field(default=1, description="Target body index (0, 1, or 2)")
    max_delta_v: float = Field(default=1.5, description="Maximum available fuel budget")
    custom_pos_a: Optional[List[Vector3D]] = None
    custom_vel_a: Optional[List[Vector3D]] = None
    custom_masses: Optional[List[float]] = None

class SlingshotPlanResponse(BaseModel):
    success: bool
    target_body_index: int
    probe_start_pos: Vector3D
    probe_start_vel: Vector3D
    burn_events: List[BurnEvent]
    total_delta_v_used: float
    max_delta_v_budget: float
    kinetic_energy_gained: float
    fuel_saved_percentage: float
    trajectory_points: List[Vector3D]
    summary_report: str
    tool_logs: List[ToolCallLog]

