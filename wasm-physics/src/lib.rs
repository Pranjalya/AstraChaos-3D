use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, Debug)]
struct Vector3 {
    x: f64,
    y: f64,
    z: f64,
}

impl Vector3 {
    fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    fn zero() -> Self {
        Self { x: 0.0, y: 0.0, z: 0.0 }
    }

    fn add(self, rhs: Self) -> Self {
        Self::new(self.x + rhs.x, self.y + rhs.y, self.z + rhs.z)
    }

    fn sub(self, rhs: Self) -> Self {
        Self::new(self.x - rhs.x, self.y - rhs.y, self.z - rhs.z)
    }

    fn scale(self, factor: f64) -> Self {
        Self::new(self.x * factor, self.y * factor, self.z * factor)
    }

    fn norm_sq(self) -> f64 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    fn norm(self) -> f64 {
        self.norm_sq().sqrt()
    }
}

#[derive(Clone, Copy, Debug)]
struct BodyState {
    pos: Vector3,
    vel: Vector3,
    mass: f64,
}

#[derive(Clone, Debug)]
struct SystemState {
    bodies: [BodyState; 3],
    probe: BodyState,
    probe_active: bool,
}

impl SystemState {
    fn compute_accelerations(&self, g_const: f64, softening_sq: f64) -> ([Vector3; 3], Vector3) {
        let mut acc = [Vector3::zero(); 3];
        for i in 0..3 {
            for j in 0..3 {
                if i == j {
                    continue;
                }
                let diff = self.bodies[j].pos.sub(self.bodies[i].pos);
                let dist_sq = diff.norm_sq() + softening_sq;
                let dist_cube = dist_sq * dist_sq.sqrt();
                if dist_cube > 1e-12 {
                    let force_mag = g_const * self.bodies[j].mass / dist_cube;
                    acc[i] = acc[i].add(diff.scale(force_mag));
                }
            }
        }

        // Acceleration of probe due to the 3 celestial bodies
        let mut probe_acc = Vector3::zero();
        if self.probe_active {
            for j in 0..3 {
                let diff = self.bodies[j].pos.sub(self.probe.pos);
                let dist_sq = diff.norm_sq() + softening_sq;
                let dist_cube = dist_sq * dist_sq.sqrt();
                if dist_cube > 1e-12 {
                    let force_mag = g_const * self.bodies[j].mass / dist_cube;
                    probe_acc = probe_acc.add(diff.scale(force_mag));
                }
            }
        }

        (acc, probe_acc)
    }

    fn rk4_step(&mut self, dt: f64, g_const: f64, softening_sq: f64) {
        // k1
        let (acc1, p_acc1) = self.compute_accelerations(g_const, softening_sq);
        let mut k1_pos = [Vector3::zero(); 3];
        let mut k1_vel = [Vector3::zero(); 3];
        for i in 0..3 {
            k1_pos[i] = self.bodies[i].vel;
            k1_vel[i] = acc1[i];
        }
        let pk1_pos = self.probe.vel;
        let pk1_vel = p_acc1;

        // k2 evaluation state
        let mut s2 = self.clone();
        for i in 0..3 {
            s2.bodies[i].pos = self.bodies[i].pos.add(k1_pos[i].scale(dt * 0.5));
            s2.bodies[i].vel = self.bodies[i].vel.add(k1_vel[i].scale(dt * 0.5));
        }
        s2.probe.pos = self.probe.pos.add(pk1_pos.scale(dt * 0.5));
        s2.probe.vel = self.probe.vel.add(pk1_vel.scale(dt * 0.5));

        let (acc2, p_acc2) = s2.compute_accelerations(g_const, softening_sq);
        let mut k2_pos = [Vector3::zero(); 3];
        let mut k2_vel = [Vector3::zero(); 3];
        for i in 0..3 {
            k2_pos[i] = s2.bodies[i].vel;
            k2_vel[i] = acc2[i];
        }
        let pk2_pos = s2.probe.vel;
        let pk2_vel = p_acc2;

        // k3 evaluation state
        let mut s3 = self.clone();
        for i in 0..3 {
            s3.bodies[i].pos = self.bodies[i].pos.add(k2_pos[i].scale(dt * 0.5));
            s3.bodies[i].vel = self.bodies[i].vel.add(k2_vel[i].scale(dt * 0.5));
        }
        s3.probe.pos = self.probe.pos.add(pk2_pos.scale(dt * 0.5));
        s3.probe.vel = self.probe.vel.add(pk2_vel.scale(dt * 0.5));

        let (acc3, p_acc3) = s3.compute_accelerations(g_const, softening_sq);
        let mut k3_pos = [Vector3::zero(); 3];
        let mut k3_vel = [Vector3::zero(); 3];
        for i in 0..3 {
            k3_pos[i] = s3.bodies[i].vel;
            k3_vel[i] = acc3[i];
        }
        let pk3_pos = s3.probe.vel;
        let pk3_vel = p_acc3;

        // k4 evaluation state
        let mut s4 = self.clone();
        for i in 0..3 {
            s4.bodies[i].pos = self.bodies[i].pos.add(k3_pos[i].scale(dt));
            s4.bodies[i].vel = self.bodies[i].vel.add(k3_vel[i].scale(dt));
        }
        s4.probe.pos = self.probe.pos.add(pk3_pos.scale(dt));
        s4.probe.vel = self.probe.vel.add(pk3_vel.scale(dt));

        let (acc4, p_acc4) = s4.compute_accelerations(g_const, softening_sq);
        let mut k4_pos = [Vector3::zero(); 3];
        let mut k4_vel = [Vector3::zero(); 3];
        for i in 0..3 {
            k4_pos[i] = s4.bodies[i].vel;
            k4_vel[i] = acc4[i];
        }
        let pk4_pos = s4.probe.vel;
        let pk4_vel = p_acc4;

        // Update body state
        for i in 0..3 {
            let d_pos = k1_pos[i]
                .add(k2_pos[i].scale(2.0))
                .add(k3_pos[i].scale(2.0))
                .add(k4_pos[i])
                .scale(dt / 6.0);

            let d_vel = k1_vel[i]
                .add(k2_vel[i].scale(2.0))
                .add(k3_vel[i].scale(2.0))
                .add(k4_vel[i])
                .scale(dt / 6.0);

            self.bodies[i].pos = self.bodies[i].pos.add(d_pos);
            self.bodies[i].vel = self.bodies[i].vel.add(d_vel);
        }

        // Update probe state if active
        if self.probe_active {
            let pd_pos = pk1_pos
                .add(pk2_pos.scale(2.0))
                .add(pk3_pos.scale(2.0))
                .add(pk4_pos)
                .scale(dt / 6.0);

            let pd_vel = pk1_vel
                .add(pk2_vel.scale(2.0))
                .add(pk3_vel.scale(2.0))
                .add(pk4_vel)
                .scale(dt / 6.0);

            self.probe.pos = self.probe.pos.add(pd_pos);
            self.probe.vel = self.probe.vel.add(pd_vel);
        }
    }
}

#[wasm_bindgen]
pub struct PhysicsEngine {
    universe_a: SystemState,
    universe_b: SystemState,
    g_const: f64,
    softening_sq: f64,
    elapsed_time: f64,
    step_count: u64,
}

#[wasm_bindgen]
impl PhysicsEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(
        masses: &[f64],
        pos_a: &[f64],
        vel_a: &[f64],
        perturbation: f64,
        g_const: f64,
        softening: f64,
    ) -> PhysicsEngine {
        let mut b_a = [
            BodyState {
                pos: Vector3::zero(),
                vel: Vector3::zero(),
                mass: 1.0,
            },
            BodyState {
                pos: Vector3::zero(),
                vel: Vector3::zero(),
                mass: 1.0,
            },
            BodyState {
                pos: Vector3::zero(),
                vel: Vector3::zero(),
                mass: 1.0,
            },
        ];

        for i in 0..3 {
            b_a[i].mass = if i < masses.len() { masses[i] } else { 1.0 };
            b_a[i].pos = Vector3::new(
                if 3 * i < pos_a.len() { pos_a[3 * i] } else { 0.0 },
                if 3 * i + 1 < pos_a.len() { pos_a[3 * i + 1] } else { 0.0 },
                if 3 * i + 2 < pos_a.len() { pos_a[3 * i + 2] } else { 0.0 },
            );
            b_a[i].vel = Vector3::new(
                if 3 * i < vel_a.len() { vel_a[3 * i] } else { 0.0 },
                if 3 * i + 1 < vel_a.len() { vel_a[3 * i + 1] } else { 0.0 },
                if 3 * i + 2 < vel_a.len() { vel_a[3 * i + 2] } else { 0.0 },
            );
        }

        let default_probe = BodyState {
            pos: Vector3::zero(),
            vel: Vector3::zero(),
            mass: 0.0,
        };

        let mut b_b = b_a.clone();
        b_b[0].pos.x += perturbation;

        PhysicsEngine {
            universe_a: SystemState {
                bodies: b_a,
                probe: default_probe,
                probe_active: false,
            },
            universe_b: SystemState {
                bodies: b_b,
                probe: default_probe,
                probe_active: false,
            },
            g_const: if g_const > 0.0 { g_const } else { 1.0 },
            softening_sq: softening * softening,
            elapsed_time: 0.0,
            step_count: 0,
        }
    }

    pub fn set_masses(&mut self, masses: &[f64]) {
        for i in 0..3 {
            if i < masses.len() {
                self.universe_a.bodies[i].mass = masses[i];
                self.universe_b.bodies[i].mass = masses[i];
            }
        }
    }

    pub fn set_probe(&mut self, pos: &[f64], vel: &[f64], active: bool) {
        let p_pos = Vector3::new(
            if pos.len() > 0 { pos[0] } else { 0.0 },
            if pos.len() > 1 { pos[1] } else { 0.0 },
            if pos.len() > 2 { pos[2] } else { 0.0 },
        );
        let p_vel = Vector3::new(
            if vel.len() > 0 { vel[0] } else { 0.0 },
            if vel.len() > 1 { vel[1] } else { 0.0 },
            if vel.len() > 2 { vel[2] } else { 0.0 },
        );

        let probe = BodyState {
            pos: p_pos,
            vel: p_vel,
            mass: 0.0,
        };

        self.universe_a.probe = probe;
        self.universe_a.probe_active = active;
        self.universe_b.probe = probe;
        self.universe_b.probe_active = active;
    }

    pub fn apply_probe_impulse(&mut self, dv_x: f64, dv_y: f64, dv_z: f64) {
        if self.universe_a.probe_active {
            let dv = Vector3::new(dv_x, dv_y, dv_z);
            self.universe_a.probe.vel = self.universe_a.probe.vel.add(dv);
            self.universe_b.probe.vel = self.universe_b.probe.vel.add(dv);
        }
    }

    pub fn get_probe_position(&self) -> Vec<f32> {
        vec![
            self.universe_a.probe.pos.x as f32,
            self.universe_a.probe.pos.y as f32,
            self.universe_a.probe.pos.z as f32,
        ]
    }

    pub fn get_probe_velocity(&self) -> Vec<f32> {
        vec![
            self.universe_a.probe.vel.x as f32,
            self.universe_a.probe.vel.y as f32,
            self.universe_a.probe.vel.z as f32,
        ]
    }

    pub fn is_probe_active(&self) -> bool {
        self.universe_a.probe_active
    }

    pub fn step(&mut self, dt: f64, steps_per_frame: usize) {
        let sub_dt = dt / (steps_per_frame as f64);
        for _ in 0..steps_per_frame {
            self.universe_a.rk4_step(sub_dt, self.g_const, self.softening_sq);
            self.universe_b.rk4_step(sub_dt, self.g_const, self.softening_sq);
        }
        self.elapsed_time += dt;
        self.step_count += steps_per_frame as u64;
    }

    pub fn get_positions_a(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(9);
        for i in 0..3 {
            out.push(self.universe_a.bodies[i].pos.x as f32);
            out.push(self.universe_a.bodies[i].pos.y as f32);
            out.push(self.universe_a.bodies[i].pos.z as f32);
        }
        out
    }

    pub fn get_positions_b(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(9);
        for i in 0..3 {
            out.push(self.universe_b.bodies[i].pos.x as f32);
            out.push(self.universe_b.bodies[i].pos.y as f32);
            out.push(self.universe_b.bodies[i].pos.z as f32);
        }
        out
    }

    pub fn get_velocities_a(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(9);
        for i in 0..3 {
            out.push(self.universe_a.bodies[i].vel.x as f32);
            out.push(self.universe_a.bodies[i].vel.y as f32);
            out.push(self.universe_a.bodies[i].vel.z as f32);
        }
        out
    }

    pub fn get_divergence(&self, body_index: usize) -> f64 {
        let idx = if body_index < 3 { body_index } else { 0 };
        let diff = self.universe_a.bodies[idx]
            .pos
            .sub(self.universe_b.bodies[idx].pos);
        diff.norm()
    }

    pub fn get_max_divergence(&self) -> f64 {
        let mut max_div = 0.0f64;
        for i in 0..3 {
            let div = self.get_divergence(i);
            if div > max_div {
                max_div = div;
            }
        }
        max_div
    }

    pub fn get_elapsed_time(&self) -> f64 {
        self.elapsed_time
    }

    pub fn reset(
        &mut self,
        masses: &[f64],
        pos_a: &[f64],
        vel_a: &[f64],
        perturbation: f64,
    ) {
        for i in 0..3 {
            self.universe_a.bodies[i].mass = if i < masses.len() { masses[i] } else { 1.0 };
            self.universe_a.bodies[i].pos = Vector3::new(
                if 3 * i < pos_a.len() { pos_a[3 * i] } else { 0.0 },
                if 3 * i + 1 < pos_a.len() { pos_a[3 * i + 1] } else { 0.0 },
                if 3 * i + 2 < pos_a.len() { pos_a[3 * i + 2] } else { 0.0 },
            );
            self.universe_a.bodies[i].vel = Vector3::new(
                if 3 * i < vel_a.len() { vel_a[3 * i] } else { 0.0 },
                if 3 * i + 1 < vel_a.len() { vel_a[3 * i + 1] } else { 0.0 },
                if 3 * i + 2 < vel_a.len() { vel_a[3 * i + 2] } else { 0.0 },
            );
        }
        self.universe_b = self.universe_a.clone();
        self.universe_b.bodies[0].pos.x += perturbation;
        self.elapsed_time = 0.0;
        self.step_count = 0;
    }
}

