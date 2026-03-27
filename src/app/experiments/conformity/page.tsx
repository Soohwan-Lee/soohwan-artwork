"use client";

import { useEffect, useRef } from "react";

// Conformity Swarm — Boids-inspired group alignment
// The cursor acts as an "AI opinion agent." Particles within range
// gradually align to face the cursor, showing normative influence.
// Particles far away exhibit natural collective behaviour (alignment + cohesion).

interface Particle {
  x: number;
  y: number;
  angle: number; // radians
  speed: number;
}

const NUM_PARTICLES = 180;
const PERCEPTION_R = 120;  // radius for flocking neighbours
const INFLUENCE_R  = 200;  // cursor influence radius
const ALIGNMENT_W  = 0.04;
const COHESION_W   = 0.0006;
const SEPARATION_R = 28;
const SEPARATION_W = 0.06;
const CURSOR_W     = 0.07;
const MAX_SPEED    = 2.2;

export default function ConformityExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let mx = W / 2, my = H / 2, mouseActive = false;

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 1.2,
    }));

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; mouseActive = true; };
    const onLeave = () => { mouseActive = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let raf: number;
    let frame = 0;

    const tick = () => {
      frame++;
      ctx.fillStyle = "rgba(5,5,5,0.18)";
      ctx.fillRect(0, 0, W, H);

      // Subtle "influence field" around cursor
      if (mouseActive) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, INFLUENCE_R);
        g.addColorStop(0, "rgba(255,255,255,0.025)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, INFLUENCE_R, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let alignX = 0, alignY = 0;
        let cohX = 0, cohY = 0;
        let sepX = 0, sepY = 0;
        let neighbours = 0;

        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const q = particles[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < PERCEPTION_R) {
            alignX += Math.cos(q.angle);
            alignY += Math.sin(q.angle);
            cohX += q.x; cohY += q.y;
            neighbours++;

            if (d < SEPARATION_R && d > 0) {
              sepX -= dx / d;
              sepY -= dy / d;
            }
          }
        }

        let ax = 0, ay = 0;
        if (neighbours > 0) {
          // Alignment
          ax += (alignX / neighbours) * ALIGNMENT_W;
          ay += (alignY / neighbours) * ALIGNMENT_W;
          // Cohesion
          ax += ((cohX / neighbours) - p.x) * COHESION_W;
          ay += ((cohY / neighbours) - p.y) * COHESION_W;
        }
        // Separation
        ax += sepX * SEPARATION_W;
        ay += sepY * SEPARATION_W;

        // Cursor influence
        if (mouseActive) {
          const cdx = mx - p.x, cdy = my - p.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cd < INFLUENCE_R) {
            const strength = CURSOR_W * (1 - cd / INFLUENCE_R);
            ax += (cdx / cd) * strength;
            ay += (cdy / cd) * strength;
          }
        }

        // Steer
        const vx = Math.cos(p.angle) * p.speed + ax;
        const vy = Math.sin(p.angle) * p.speed + ay;
        const spd = Math.sqrt(vx * vx + vy * vy);
        p.angle = Math.atan2(vy, vx);
        p.speed = Math.min(spd, MAX_SPEED);
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        // Wrap
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Draw elongated particle (shows direction)
        const len = 6 + p.speed * 2;
        const ex = Math.cos(p.angle) * len;
        const ey = Math.sin(p.angle) * len;

        // Colour: influenced particles trend white, free ones are dimmer
        const cdx2 = mx - p.x, cdy2 = my - p.y;
        const influenced = mouseActive && Math.sqrt(cdx2*cdx2 + cdy2*cdy2) < INFLUENCE_R;
        const alpha = influenced ? 0.9 : 0.4;
        const hue = influenced ? "255,255,255" : "160,160,180";

        ctx.beginPath();
        ctx.moveTo(p.x - ex * 0.5, p.y - ey * 0.5);
        ctx.lineTo(p.x + ex, p.y + ey);
        ctx.strokeStyle = `rgba(${hue},${alpha})`;
        ctx.lineWidth = influenced ? 1.5 : 0.8;
        ctx.stroke();
      }

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
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{
        position:"absolute", bottom:28, left:32,
        fontFamily:"monospace", fontSize:"11px", color:"#444",
        letterSpacing:"0.08em", textTransform:"uppercase",
        pointerEvents:"none", lineHeight:1.8,
      }}>
        <div>Move cursor — observe influence propagation</div>
        <div style={{color:"#2a2a2a"}}>White trails: influenced · Dim trails: autonomous</div>
      </div>
    </div>
  );
}
