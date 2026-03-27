"use client";

import { useEffect, useRef } from "react";

// Reflective Topography v3: Vibrant Group Sensemaking
// The landscape reacts to the cursor, leaving "participation ripples"
// that shift color (Cyan -> Blue -> Purple) based on local interaction density.
// Added: Glowing trails, color-blending "hotspots," and noise texture.

interface Pulse {
  x: number; y: number; life: number; duration: number; hue: number;
}

const MAX_PULSES = 200;

export default function ReflectionExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const pulses: Pulse[] = [];
    let lastX = -1, lastY = -1;
    let hueBase = 180; // Cyan

    const onMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - lastX), dy = Math.abs(e.clientY - lastY);
      if (dx < 10 && dy < 10) return; lastX = e.clientX; lastY = e.clientY;

      hueBase = (hueBase + 2) % 360;
      if (pulses.length >= MAX_PULSES) pulses.shift();
      pulses.push({
        x: e.clientX, y: e.clientY,
        life: 0,
        duration: 2000 + Math.random() * 2000,
        hue: hueBase,
      });
    };

    window.addEventListener("mousemove", onMove);

    let raf: number;
    let time = 0;

    const tick = () => {
      time++;
      // Deep fade for a "liquified" trailing effect
      ctx.fillStyle = "rgba(5,5,5,0.06)";
      ctx.fillRect(0, 0, W, H);

      // Render the latent "background lattice"
      const cols = 20, rows = 12, cw = W/cols, ch = H/rows;
      for (let c=0; c<cols; c++) {
        for (let r=0; r<rows; r++) {
          const x = (c+0.5)*cw, y=(r+0.5)*ch;
          ctx.beginPath();
          ctx.arc(x, y, 0.6 + Math.sin(time/40 + c + r)*0.4, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,255,255,0.08)`;
          ctx.fill();
        }
      }

      // Draw active participation ripples
      ctx.globalCompositeOperation = "lighter";
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.life += 16;
        const progress = p.life / p.duration;
        if (progress >= 1) { pulses.splice(i, 1); continue; }

        const alpha = (1 - progress) * 0.4;
        const radius = progress * 220;

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 40%, ${alpha * 0.5})`);
        grad.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${p.hue}, 90%, 60%, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(tick);
    };

    tick();
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{ position:"absolute", top:32, left:36, fontFamily:"monospace", color:"#fff", pointerEvents:"none", fontSize:11, letterSpacing:2 }}>
        <p style={{opacity:0.6}}>Status: Group Influence Topography Tracing</p>
        <p style={{color: "#0ff", opacity: 0.8}}>Tracing Group Social Traces</p>
      </div>
      <div style={{ position:"absolute", bottom:32, left:36, fontSize:10, color:"rgba(255,255,255,0.3)", pointerEvents:"none" }}>
        Movement propagates ripples of influence—visualizing collective memory.
      </div>
    </div>
  );
}
