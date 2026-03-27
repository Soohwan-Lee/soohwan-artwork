"use client";

import { useEffect, useRef, useState } from "react";

// Dissenting Minority v3: Power Asymmetry & Resistance
// The network pulses with "Information Flow." 
// When mediation is triggered, a vibrant "Red Wave" propagates
// from the minority cores, protecting the dissenters and
// momentarily disrupting the majority's pull.
// Added: Glowing nodes, pulsing edges, and shockwave propagation.

interface Node {
  id: number; x: number; y: number; vx: number; vy: number;
  opinion: number; isCore: boolean; radius: number;
  pulse: number;
}

interface Edge { a: number; b: number; strength: number; }

const N_NODES = 70;
const N_MINORITY = 4;
const CONNECT_R = 140;

export default function DissentExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mediation, setMediation] = useState(false);
  const medRef = useRef(false);

  useEffect(() => { medRef.current = mediation; }, [mediation]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const nodes: Node[] = Array.from({ length: N_NODES }, (_, i) => ({
      id: i,
      x: W * 0.15 + Math.random() * W * 0.7,
      y: H * 0.15 + Math.random() * H * 0.7,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opinion: i < N_MINORITY ? 1 : 0,
      isCore: i < N_MINORITY,
      radius: i < N_MINORITY ? 8 : 4.5,
      pulse: 0,
    }));

    const edges: Edge[] = [];
    for (let i = 0; i < N_NODES; i++) {
      for (let j = i + 1; j < N_NODES; j++) {
        const d = Math.sqrt(Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2));
        if (d < CONNECT_R) edges.push({ a: i, b: j, strength: 1 - d/CONNECT_R });
      }
    }

    let raf: number;
    let time = 0;

    const tick = () => {
      time++;
      ctx.fillStyle = "rgba(5,5,5,0.4)";
      ctx.fillRect(0, 0, W, H);

      const isMed = medRef.current;

      // Update dynamics
      for (const n of nodes) {
        if (n.isCore && isMed) {
          n.opinion = 1.0; n.pulse = Math.sin(time/5)*0.5 + 0.5;
        } else {
          let sum = 0, count = 0;
          for (const e of edges) {
            let o = -1; if (e.a === n.id) o = e.b; else if (e.b === n.id) o = e.a;
            if (o !== -1) { sum += nodes[o].opinion; count++; }
          }
          const avg = count > 0 ? sum / count : 0;
          const drift = (avg - n.opinion) * 0.008 + (0 - n.opinion) * 0.005;
          const boost = isMed && n.opinion > 0.4 ? 0.006 : 0;
          n.opinion = Math.max(0, Math.min(1, n.opinion + drift + boost));
          n.pulse *= 0.95;
        }

        n.x += n.vx; n.y += n.vy;
        if (n.x < 40 || n.x > W-40) n.vx *= -1;
        if (n.y < 40 || n.y > H-40) n.vy *= -1;
      }

      // Draw Edges with glowing flow
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const avgOp = (a.opinion + b.opinion) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        
        const opacity = 0.05 + e.strength * 0.15 + avgOp * 0.4;
        const color = avgOp > 0.5 ? `255,100,100` : `100,120,255`;
        ctx.strokeStyle = `rgba(${color},${opacity})`;
        ctx.lineWidth = 0.5 + avgOp * 1.5;
        ctx.stroke();

        // Animate a "pulse" particle along edges
        if (Math.random() < 0.02) {
          const t = (time % 100) / 100;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.fillStyle = `rgba(${color},${opacity * 2})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Nodes
      for (const n of nodes) {
        const hue = n.opinion > 0.5 ? `255, 60, 60` : `80, 100, 240`;
        const size = n.radius + (n.opinion * 3);

        if (n.opinion > 0.5) {
          ctx.shadowBlur = 10 + n.pulse * 20;
          ctx.shadowColor = `rgba(${hue}, 0.8)`;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hue}, ${0.4 + n.opinion * 0.6})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core Ring
        if (n.isCore) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, size + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div 
      style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"pointer" }}
      onPointerDown={() => setMediation(true)}
      onPointerUp={() => setMediation(false)}
    >
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{ position:"absolute", top:32, left:36, fontFamily:"monospace", color:"#fff", pointerEvents:"none", fontSize:11, letterSpacing:2 }}>
        <p style={{opacity:0.6}}>Status: Minority Influence Resistance Test</p>
        <p style={{color: mediation ? "#ff3c3c" : "#5064f0", transition:"color 0.3s"}}>
          {mediation ? ">> MEDIATION PULSE ACTIVE <<" : ">> ASSIMILATION PRESSURE: HIGH <<"}
        </p>
      </div>
      <div style={{ position:"absolute", bottom:32, left:36, fontSize:10, color:"rgba(255,255,255,0.3)", pointerEvents:"none" }}>
        Hold to trigger AI-mediated resistance signals.
      </div>
    </div>
  );
}
