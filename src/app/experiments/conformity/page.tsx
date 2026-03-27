"use client";

import { useEffect, useRef } from "react";

// Conformity Swarm v3: Vibrant & Dynamic Influence
// The swarm represents a "Networked Group." When the AI agent (cursor)
// enters the field, particles shift color (Cyan -> Magenta) as they
// experience high-pressure normative influence.
// Added: Glow effects, motion trails, and vibrant color mapping.

interface Particle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  influence: number; 
}

const NUM_PARTICLES = 160;
const PERCEPTION_R = 100;
const INFLUENCE_R  = 220;
const ALIGNMENT_W  = 0.05;
const COHESION_W   = 0.0008;
const SEPARATION_R = 30;
const SEPARATION_W = 0.08;
const CURSOR_W     = 0.12;
const MAX_SPEED    = 2.8;

export default function ConformityExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    let mx = W / 2, my = H / 2, mouseActive = false;

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 1.5,
      color: "rgb(255,255,255)",
      influence: 0,
    }));

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; mouseActive = true; };
    const onLeave = () => { mouseActive = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let raf: number;

    const tick = () => {
      // Create a persistent "energy trail" effect using semi-transparent overlay
      ctx.fillStyle = "rgba(5,5,5,0.22)"; // Denser trail
      ctx.fillRect(0, 0, W, H);

      // Render a subtle influence "Pulse Field"
      if (mouseActive) {
        const timePulse = Math.sin(Date.now()/500) * 20;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, INFLUENCE_R + timePulse);
        g.addColorStop(0, "rgba(0,255,255,0.06)");
        g.addColorStop(0.5, "rgba(255,0,255,0.03)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, INFLUENCE_R + timePulse, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let alignX = 0, alignY = 0, cohX = 0, cohY = 0, sepX = 0, sepY = 0, neighbours = 0;

        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const q = particles[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < PERCEPTION_R) {
            alignX += Math.cos(q.angle); alignY += Math.sin(q.angle);
            cohX += q.x; cohY += q.y;
            neighbours++;
            if (d < SEPARATION_R && d > 0) { sepX -= dx / d; sepY -= dy / d; }
          }
        }

        let ax = 0, ay = 0;
        if (neighbours > 0) {
          ax += (alignX / neighbours) * ALIGNMENT_W;
          ay += (alignY / neighbours) * ALIGNMENT_W;
          ax += ((cohX / neighbours) - p.x) * COHESION_W;
          ay += ((cohY / neighbours) - p.y) * COHESION_W;
        }
        ax += sepX * SEPARATION_W; ay += sepY * SEPARATION_W;

        if (mouseActive) {
          const cdx = mx - p.x, cdy = my - p.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cd < INFLUENCE_R) {
            p.influence = 1 - cd / INFLUENCE_R;
            const strength = CURSOR_W * p.influence;
            ax += (cdx / cd) * strength;
            ay += (cdy / cd) * strength;
          } else { p.influence *= 0.9; }
        } else { p.influence *= 0.9; }

        const vx = Math.cos(p.angle) * p.speed + ax;
        const vy = Math.sin(p.angle) * p.speed + ay;
        p.angle = Math.atan2(vy, vx);
        p.speed = Math.min(Math.sqrt(vx * vx + vy * vy), MAX_SPEED);
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        // "VIBRANT" COLOR MAPPING
        // Neutral: Cool Cyan/White
        // Influenced: Magenta/Neon Pink
        const r = Math.round(100 + p.influence * 155);
        const g = Math.round(255 - p.influence * 200);
        const b = Math.round(255 - p.influence * 50);
        
        ctx.beginPath();
        const len = 4 + p.speed * 3;
        const ex = Math.cos(p.angle) * len;
        const ey = Math.sin(p.angle) * len;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - ex, p.y - ey);
        
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + p.influence * 0.6})`;
        ctx.lineWidth = 1.2 + p.influence * 2;
        ctx.stroke();

        // Little glowing head
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 + p.influence * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseleave", onLeave); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{
        position:"absolute", bottom:32, left:36,
        fontFamily:"monospace", fontSize:"11px", color:"rgba(255,255,255,0.4)",
        letterSpacing:"0.12em", textTransform:"uppercase", pointerEvents:"none",
      }}>
        <div style={{color:"#0ff", marginBottom:"4px"}}>Status: Multi-agent Synchrony Test</div>
        <div>Normative Pull: {`[|||||-----]`}</div>
      </div>
    </div>
  );
}
