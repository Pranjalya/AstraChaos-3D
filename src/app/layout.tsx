import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AstraChaos 3D | Three-Body Gravitational Chaos & Butterfly Effect Sandbox',
  description:
    'An interactive 3D simulation of the chaotic Three-Body Problem showing the Butterfly Effect via parallel overlaid universes powered by a Rust WebAssembly RK4 physics engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-space-900 text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
