# AstraChaos 3D 🦋🪐

AstraChaos 3D is a high-performance, interactive, parallel 3D celestial mechanics sandbox engineered to visualize the **Butterfly Effect** using the deterministic chaos of the Three-Body Problem. 

By simulating two independent, concurrent mathematical universes overlaid in real time—where Universe B is modified by only a microscopic deviation ($10^{-7}$) relative to Universe A—the sandbox physically visualizes the exact moment determinism breaks down into absolute chaos.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework:** Next.js (App Router) & TypeScript
- **3D Rendering Pipeline:** React Three Fiber (R3F) & WebGL/Three.js
- **High-Performance Physics Core:** Rust compiled to WebAssembly (`wasm-pack`)
- **Numerical Integrator:** 4th-Order Runge-Kutta (RK4) Solver
- **UI & Real-time Charts:** Tailwind CSS & Recharts

---

## 🚀 Key Features

- **Dual-Timeline Overlays:** Watch Universe A (Electric Cyan) and Universe B (Hot Magenta) orbit symmetrically before splitting into radically different 3D vectors.
- **The Chaos Gauge:** A live analytics panel rendering the exact Euclidean divergence distance over time, plotting the exponential scale of the Lyapunov exponent.
- **Quantum Perturbation Control:** Alter the size of your "butterfly" using a sliding scale parameter, adjusting the displacement from $10^{-3}$ down to $10^{-9}$.
- **Relative Frame Tracking:** Lock the camera view onto a single planet to inspect complex gravitational choreography from an objective, moving spatial perspective.
- **Orbital Labs Preset Vault:** Instantly spin up chaotic or beautifully periodic solutions, including the chaotic figure-eight, Lagrange horseshoe, and unstable hyper-collision loops.

---

## ⚙️ Core Physics Engine Mechanics

The application utilizes standard Newtonian mechanics generalized to three dimensions. The acceleration $\mathbf{a}_i$ acting on any body $i$ due to the gravitational interaction of other bodies $j$ is continuously evaluated as:

$$\mathbf{a}_i = \sum_{j \neq i} G \frac{m_j (\mathbf{r}_j - \mathbf{r}_i)}{|\mathbf{r}_j - \mathbf{r}_i|^3}$$

To eliminate structural drift inherent in standard Euler integration methods, the system utilizes a **4th-Order Runge-Kutta (RK4)** integration schema executed inside WebAssembly, ensuring precise position caching across small time slices ($dt$).

---

## 📦 Local Installation & Setup

Ensure you have **Node.js (v18+)**, **Rust**, and **wasm-pack** globally installed on your environment.

1. **Clone the Repository:**
```bash
git clone https://github.com/Pranjalya/AstraChaos-3D.git
cd AstraChaos-3D
```

2. **Compile the Physics Core (Rust to WASM):**
```bash
cd wasm-physics
wasm-pack build --target web
cd ..
```


3. **Install UI Frontend Dependencies:**
```bash
npm install
```


4. **Boot the Application Platform:**
```bash
npm run dev
```


Open `http://localhost:3000` in your browser to launch the interface.