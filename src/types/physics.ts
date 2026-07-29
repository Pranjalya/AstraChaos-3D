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

export interface InverseOptimizationProgressPayload {
  type: 'progress' | 'complete';
  generation?: number;
  max_generations?: number;
  progress_pct?: number;
  best_fitness?: number;
  goal_type?: string;
  // If complete, contains CopilotResponsePayload fields
  success?: boolean;
  system_name?: string;
  description?: string;
  masses?: [number, number, number];
  pos_a?: [Vector3D, Vector3D, Vector3D];
  vel_a?: [Vector3D, Vector3D, Vector3D];
  body_colors?: [string, string, string];
  recommended_dt?: number;
  recommended_sub_steps?: number;
  recommended_perturbation?: number;
  diagnostics?: PhysicsDiagnostics;
  tool_logs?: ToolCallLog[];
}


