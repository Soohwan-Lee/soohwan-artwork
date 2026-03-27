"use client";

import { useEffect, useRef } from "react";

// Reflective Topography — Group Sensemaking Landscape
// The canvas is a continuous flow field representing opinion pressure.
// Each mouse event leaves a "participation trace" — a ripple with
// its own hue encoding the moment in time it was made.
// Over time traces fade, but linger long enough for the user to
// see the topography of their own influence trajectory.

interface Ripple {
  x: number;
  y: number;
  birth: number;   // ms timestamp
  life: number;    // total lifetime (ms)
  hue: number;
  intensity: number;
}

const MAX_RIPPLES = 300;

export default function ReflectionExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const ripples: Ripple[] = [];
    let lastX = -1, lastY = -1;
    let hueBase = 200;  // start at cool blue

    // Persistent field drawn once — a faint grid of "latent values"
    const drawField = () => {
      const cols = 24, rows = 14;
      const cw = W / cols, ch = H / rows;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fill();
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 12 && lastX !== -1) return;

      lastX = e.clientX; lastY = e.clientY;
      hueBase = (hueBase + 1.5) % 360;

      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      ripples.push({
        x: e.clientX, y: e.clientY,
        birth: performance.now(),
        life: 3000 + Math.random() * 2000,
        hue: hueBase,
        intensity: 0.6 + Math.random() * 0.4,
      });
    };

    window.addEventListener("mousemove", onMove);

    let raf: number;
    const bg = "#050505";

    const tick = () => {
      const now = performance.now();

      // Clear with slight fade
      ctx.fillStyle = "rgba(5,5,5,0.08)";
      ctx.fillRect(0, 0, W, H);

      // Draw latent field dots (very subtle)
      drawField();

      // Draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const elapsed = now - r.birth;
        if (elapsed >= r.life) { ripples.splice(i, 1); continue; }

        const progress = elapsed / r.life;
        const maxRadius = 180;
        const radius = progress * maxRadius;
        const alpha = r.intensity * (1 - progress) * 0.25;

        // Outer ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue},70%,65%,${alpha})`;
        ctx.lineWidth = (1 - progress) * 1.5;
        ctx.stroke();

        // Inner core (small bright dot that fades quickly)
        if (progress < 0.2) {
          const coreAlpha = (0.2 - progress) / 0.2 * 0.6;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${r.hue},80%,80%,${coreAlpha})`;
          ctx.fill();
        }
      }

      // Participation counter
      ctx.fillStyle = "rgba(60,60,80,0.7)";
      ctx.font = "11px monospace";
      ctx.fillText(`ACTIVE TRACES — ${ripples.length}`, 32, H - 28);

      raf = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{
        position:"absolute", top:28, left:32,
        fontFamily:"monospace", fontSize:"11px",
        color:"rgba(80,80,100,0.7)",
        letterSpacing:"0.08em", textTransform:"uppercase",
        pointerEvents:"none",
      }}>
        Move — your trajectory leaves influence traces
      </div>
    </div>
  );
}
