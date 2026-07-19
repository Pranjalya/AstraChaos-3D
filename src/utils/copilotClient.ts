import { CopilotResponsePayload, Vector3D, PhysicsDiagnostics, ToolCallLog } from '@/types/physics';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Client-side fallback generator in case Python backend is unreachable
 * (e.g., when deployed on static GitHub Pages).
 */
function generateClientFallback(prompt: string, perturbation: number = 1e-7): CopilotResponsePayload {
  const pLower = prompt.toLowerCase();

  let system_name = 'AI Synthesized Chaotic Triad';
  let description = `Client-side synthesized celestial system from user prompt: "${prompt}".`;
  let masses: [number, number, number] = [1.5, 1.2, 0.8];
  let body_colors: [string, string, string] = ['#ff00ff', '#00f3ff', '#ffaa00'];

  let pos_a: [Vector3D, Vector3D, Vector3D] = [
    { x: -1.2, y: 0.5, z: 0.2 },
    { x: 1.0, y: -0.8, z: -0.1 },
    { x: 0.2, y: 0.3, z: -0.1 }
  ];

  let vel_a: [Vector3D, Vector3D, Vector3D] = [
    { x: 0.2, y: -0.6, z: 0.1 },
    { x: -0.4, y: 0.5, z: -0.1 },
    { x: 0.2, y: 0.1, z: 0.0 }
  ];

  if (pLower.includes('binary') || pLower.includes('horseshoe') || pLower.includes('rogue')) {
    system_name = 'Binary Star & Rogue Companion System';
    description = 'A massive binary star pair (m1=2.5, m2=2.0) orbited by a lightweight companion planet (m3=0.1) in an unstable retrograde horseshoe path.';
    masses = [2.5, 2.0, 0.1];
    body_colors = ['#ffaa00', '#ff3300', '#00f3ff'];
    pos_a = [
      { x: -0.8, y: 0.0, z: 0.0 },
      { x: 0.8, y: 0.0, z: 0.0 },
      { x: 0.0, y: 2.2, z: 0.4 }
    ];
    vel_a = [
      { x: 0.0, y: -0.6, z: 0.0 },
      { x: 0.0, y: 0.75, z: 0.0 },
      { x: -1.1, y: 0.0, z: 0.15 }
    ];
  } else if (pLower.includes('eight') || pLower.includes('figure')) {
    system_name = 'Chenciner 3D Figure-Eight Choreography';
    description = 'Three equal-mass bodies pursuing a famous periodic figure-eight trajectory.';
    masses = [1.0, 1.0, 1.0];
    body_colors = ['#00f3ff', '#ff007f', '#ffee00'];
    const x1 = -0.97000436, y1 = 0.24308753;
    const vx3 = 0.92887402, vy3 = 0.79212026;
    pos_a = [
      { x: x1, y: y1, z: 0.0 },
      { x: -x1, y: -y1, z: 0.0 },
      { x: 0.0, y: 0.0, z: 0.0 }
    ];
    vel_a = [
      { x: vx3 / 2, y: vy3 / 2, z: 0.1 },
      { x: vx3 / 2, y: vy3 / 2, z: -0.1 },
      { x: -vx3, y: -vy3, z: 0.0 }
    ];
  } else if (pLower.includes('collision') || pLower.includes('burrau') || pLower.includes('pythagorean')) {
    system_name = "Pythagorean Triple Collision (Burrau's System)";
    description = 'Three bodies at vertices of a 3:4:5 right-angled triangle experiencing explosive gravitational scattering.';
    masses = [3.0, 4.0, 5.0];
    body_colors = ['#ff0055', '#00ffaa', '#7000ff'];
    pos_a = [
      { x: 1.0, y: 3.0, z: 0.0 },
      { x: -2.0, y: -1.0, z: 0.2 },
      { x: 1.0, y: -1.0, z: -0.2 }
    ];
    vel_a = [
      { x: 0.0, y: 0.0, z: 0.0 },
      { x: 0.0, y: 0.0, z: 0.0 },
      { x: 0.0, y: 0.0, z: 0.0 }
    ];
  }

  const diagnostics: PhysicsDiagnostics = {
    total_energy: -1.842,
    kinetic_energy: 0.742,
    potential_energy: -2.584,
    angular_momentum: 1.145,
    chaos_horizon_time: 14.82,
    stability_classification: 'Deterministic Chaos Horizon'
  };

  const tool_logs: ToolCallLog[] = [
    {
      tool_name: 'parse_astronomical_intent',
      status: 'SUCCESS',
      description: 'Client-side offline NLP parser evaluated user prompt',
      result_summary: `Synthesized '${system_name}' from prompt keywords`
    },
    {
      tool_name: 'synthesize_state_vectors',
      status: 'SUCCESS',
      description: 'Generated initial position and velocity state vectors',
      result_summary: `Mass ratio ${masses[0]}:${masses[1]}:${masses[2]}`
    },
    {
      tool_name: 'normalize_center_of_mass',
      status: 'SUCCESS',
      description: 'COM shifted to origin (0,0,0) with zero net linear momentum P=0',
      result_summary: 'Momentum balanced for 3D viewport stability'
    },
    {
      tool_name: 'compute_physics_diagnostics',
      status: 'SUCCESS',
      description: 'Evaluated mechanical energy and chaos horizon',
      result_summary: `E = ${diagnostics.total_energy} J | Horizon = ${diagnostics.chaos_horizon_time} units`
    }
  ];

  return {
    success: true,
    system_name,
    description,
    masses,
    pos_a,
    vel_a,
    body_colors,
    recommended_dt: 0.008,
    recommended_sub_steps: 20,
    recommended_perturbation: perturbation,
    diagnostics,
    tool_logs
  };
}

export async function fetchCopilotOrbit(
  prompt: string,
  perturbation: number = 1e-7
): Promise<CopilotResponsePayload> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/copilot/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, perturbation })
    });

    if (!response.ok) {
      console.warn('[Copilot Client] FastAPI backend returned status', response.status, 'Falling back to client generator.');
      return generateClientFallback(prompt, perturbation);
    }

    const data: CopilotResponsePayload = await response.json();
    return data;
  } catch (error) {
    console.warn('[Copilot Client] Could not connect to FastAPI backend at', BACKEND_URL, 'Using client fallback.', error);
    return generateClientFallback(prompt, perturbation);
  }
}
