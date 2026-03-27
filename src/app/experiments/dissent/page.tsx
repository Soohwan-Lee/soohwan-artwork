"use client";

import { useEffect, useRef, useState } from "react";

// Dissenting Minority — Social Network Simulation
// A graph of nodes where the majority (grey) exert constant pressure
// on minority nodes (red) to "absorb" them into consensus.
// Click/hold to trigger AI mediation: minority nodes resist and 
// their influence slowly diffuses outward, converting nearby nodes.

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opinion: number;   // 0 = full majority, 1 = full minority
  isCore: boolean;   // one of the original minority seeds
  radius: number;
}

interface Edge {
  a: number;
  b: number;
}

const N_NODES = 80;
const N_MINORITY = 6;
const CONNECT_R = 130;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function opinionColor(o: number) {
  // 0 → dim grey-blue, 1 → vivid red
  const r = Math.round(lerp(50, 220, o));
  const g = Math.round(lerp(50, 40, o));
  const b = Math.round(lerp(70, 40, o));
  return `rgb(${r},${g},${b})`;
}

export default function DissentExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mediation, setMediation] = useState(false);
  const mediationRef = useRef(false);

  useEffect(() => {
    mediationRef.current = mediation;
  }, [mediation]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    // Build nodes
    const nodes: Node[] = Array.from({ length: N_NODES }, (_, i) => ({
      id: i,
      x: W * 0.1 + Math.random() * W * 0.8,
      y: H * 0.1 + Math.random() * H * 0.8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      opinion: i < N_MINORITY ? 1 : 0,
      isCore: i < N_MINORITY,
      radius: i < N_MINORITY ? 7 : 4,
    }));

    // Build edges (proximity based)
    const edges: Edge[] = [];
    for (let i = 0; i < N_NODES; i++) {
      for (let j = i + 1; j < N_NODES; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx*dx + dy*dy) < CONNECT_R) {
          edges.push({ a: i, b: j });
        }
      }
    }

    let raf: number;

    const tick = () => {
      ctx.fillStyle = "rgba(5,5,5,0.35)";
      ctx.fillRect(0, 0, W, H);

      const isMediating = mediationRef.current;

      // Update opinions
      for (const node of nodes) {
        if (node.isCore && isMediating) {
          // Core minority stays firm + radiates outward
          node.opinion = Math.min(1, node.opinion + 0.02);
          continue;
        }
        // Social pressure: average of neighbours
        let sum = 0, count = 0;
        for (const e of edges) {
          let other = -1;
          if (e.a === node.id) other = e.b;
          if (e.b === node.id) other = e.a;
          if (other !== -1) { sum += nodes[other].opinion; count++; }
        }
        if (count > 0) {
          const avg = sum / count;
          const pullMajority = (0 - node.opinion) * 0.004;      // pull to 0
          const pullAvg      = (avg - node.opinion) * 0.008;
          const pullMinority = isMediating ? (node.opinion < 0.5 ? 0 : 0.003) : 0;
          node.opinion = Math.max(0, Math.min(1,
            node.opinion + pullMajority + pullAvg + pullMinority
          ));
        }
      }

      // Move nodes (gentle brownian drift)
      for (const n of nodes) {
        n.vx += (Math.random() - 0.5) * 0.05;
        n.vy += (Math.random() - 0.5) * 0.05;
        n.vx *= 0.96; n.vy *= 0.96;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 30) n.x = 30;
        if (n.x > W-30) n.x = W-30;
        if (n.y < 30) n.y = 30;
        if (n.y > H-30) n.y = H-30;
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const avgOp = (a.opinion + b.opinion) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${Math.round(lerp(30,100,avgOp))},${Math.round(lerp(30,30,avgOp))},${Math.round(lerp(45,30,avgOp))},0.35)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        // Halo for mediated minority
        if (isMediating && n.opinion > 0.5) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 8 + Math.sin(Date.now()/300)*3, 0, Math.PI*2);
          ctx.fillStyle = `rgba(220,40,40,${(n.opinion - 0.5) * 0.15})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
        ctx.fillStyle = opinionColor(n.opinion);
        ctx.fill();
      }

      // Status label
      const minorityStrength = nodes.filter(n => n.opinion > 0.5).length;
      ctx.fillStyle = isMediating ? "rgba(220,40,40,0.8)" : "rgba(80,80,100,0.8)";
      ctx.font = "11px monospace";
      ctx.fillText(
        isMediating
          ? `AI MEDIATION ACTIVE — ${minorityStrength} nodes hold minority view`
          : `ASSIMILATION IN PROGRESS — ${minorityStrength} nodes holding`,
        32, H - 28
      );

      raf = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div
      style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"pointer" }}
      onPointerDown={() => setMediation(true)}
      onPointerUp={() => setMediation(false)}
      onPointerLeave={() => setMediation(false)}
    >
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{
        position:"absolute", top:28, left:32,
        fontFamily:"monospace", fontSize:"11px",
        color: mediation ? "rgba(220,40,40,0.7)" : "rgba(80,80,80,0.7)",
        letterSpacing:"0.08em", textTransform:"uppercase",
        pointerEvents:"none", transition:"color 0.3s",
      }}>
        {mediation ? "Mediation Active — hold to sustain" : "Press & hold to activate AI mediation"}
      </div>
    </div>
  );
}
