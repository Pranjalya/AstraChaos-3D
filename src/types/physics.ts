export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BodyData {
  id: number;
  name: string;
  mass: number;
  color: string;
  radius: number;
  pos: Vector3D;
  vel: Vector3D;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  gConst: number;
  softening: number;
  defaultDt: number;
  defaultSubSteps: number;
  masses: [number, number, number];
  posA: [Vector3D, Vector3D, Vector3D];
  velA: [Vector3D, Vector3D, Vector3D];
  bodyColors?: [string, string, string];
}

export type CameraTargetMode = 'free' | 'body0' | 'body1' | 'body2' | 'com';

export interface DivergencePoint {
  time: number;
  divergence: number;
  logDivergence: number;
}

export interface ToolCallLog {
  tool_name: string;
  status: string;
  description: string;
  result_summary: string;
}

export interface PhysicsDiagnostics {
  total_energy: number;
  kinetic_energy: number;
  potential_energy: number;
  angular_momentum: number;
  chaos_horizon_time: number;
  stability_classification: string;
}

export interface CopilotResponsePayload {
  success: boolean;
  system_name: string;
  description: string;
  masses: [number, number, number];
  pos_a: [Vector3D, Vector3D, Vector3D];
  vel_a: [Vector3D, Vector3D, Vector3D];
  body_colors: [string, string, string];
  recommended_dt: number;
  recommended_sub_steps: number;
  recommended_perturbation: number;
  diagnostics: PhysicsDiagnostics;
  tool_logs: ToolCallLog[];
}

export interface BurnEvent {
  time: number;
  delta_v: Vector3D;
  fuel_used: number;
  description: string;
}

export interface SlingshotPlan {
  success: boolean;
  target_body_index: number;
  probe_start_pos: Vector3D;
  probe_start_vel: Vector3D;
  burn_events: BurnEvent[];
  total_delta_v_used: number;
  max_delta_v_budget: number;
  kinetic_energy_gained: number;
  fuel_saved_percentage: number;
  trajectory_points: Vector3D[];
  summary_report: string;
  tool_logs: ToolCallLog[];
}


