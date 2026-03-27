"use client";

import { useEffect, useRef, useState } from "react";

// Dissenting Minority v5: Slow, Meditative Force-Directed Social Network
// Physics are tuned for calm, deliberate motion.
// Majority forms a loose, organic cluster. Minority floats on the edges.
// Hold to trigger AI Mediation: a slow, powerful expanding shield.

interface Node {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  isMinority: boolean;
  radius: number;
}

interface Edge {
  source: Node;
  target: Node;
}

const N_NODES = 75;
const N_MINORITY = 5;

// Very slow, gentle physics
const REPULSION = 550;
const ATTRACTION = 0.004;
const DAMPING = 0.92;
const CENTER_FORCE = 0.006;
const REST_LEN = 70;

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
      x: W / 2 + (Math.random() - 0.5) * 300,
      y: H / 2 + (Math.random() - 0.5) * 300,
      vx: 0, vy: 0,
      isMinority: i < N_MINORITY,
      radius: i < N_MINORITY ? 7 : 4,
    }));

    const edges: Edge[] = [];
    for (let i = 0; i < N_NODES; i++) {
      for (let j = i + 1; j < N_NODES; j++) {
        const n1 = nodes[i], n2 = nodes[j];
        let prob = 0;
        if (!n1.isMinority && !n2.isMinority) prob = 0.10;
        if (n1.isMinority && n2.isMinority) prob = 0.60;
        if (n1.isMinority !== n2.isMinority) prob = 0.008;
        if (Math.random() < prob) edges.push({ source: n1, target: n2 });
      }
    }

    let raf: number;
    let time = 0;
    let medShield = 0; // 0-1, animates slowly

    const tick = () => {
      time++;
      const isMed = medRef.current;

      // Animate shield in/out smoothly
      medShield += isMed ? 0.015 : -0.012;
      medShield = Math.max(0, Math.min(1, medShield));

      ctx.fillStyle = "rgba(5,5,5,0.25)";
      ctx.fillRect(0, 0, W, H);

      // --- Force Calculation ---
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        // Gentle center pull
        let fx = (W / 2 - n1.x) * CENTER_FORCE;
        let fy = (H / 2 - n1.y) * CENTER_FORCE;

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;

          let repulse = REPULSION / distSq;

          // Shield: minority slowly repels majority when active
          if (n1.isMinority && !n2.isMinority && dist < 180) {
            repulse += (medShield * 60) / distSq;
          }

          fx += (dx / dist) * repulse;
          fy += (dy / dist) * repulse;
        }

        n1.vx += fx; n1.vy += fy;
      }

      // Spring forces along edges
      for (const edge of edges) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - REST_LEN) * ATTRACTION;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        edge.source.vx += fx; edge.source.vy += fy;
        edge.target.vx -= fx; edge.target.vy -= fy;
      }

      // Update positions
      for (const n of nodes) {
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 60) n.vx += 1.5;
        if (n.x > W - 60) n.vx -= 1.5;
        if (n.y < 60) n.vy += 1.5;
        if (n.y > H - 60) n.vy -= 1.5;
      }

      // --- Draw Edges ---
      for (const edge of edges) {
        const isMinEdge = edge.source.isMinority || edge.target.isMinority;
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        if (isMinEdge) {
          ctx.strokeStyle = `rgba(255, 80, 80, ${0.12 + medShield * 0.35})`;
          ctx.lineWidth = 0.8 + medShield;
        } else {
          ctx.strokeStyle = "rgba(100, 140, 255, 0.10)";
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      // --- Draw Nodes ---
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.isMinority) {
          // Slow pulsing shield aura
          if (medShield > 0.05) {
            const auraR = 28 + Math.sin(time * 0.04) * 8;
            const aura = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, auraR * medShield);
            aura.addColorStop(0, `rgba(255, 40, 40, ${0.25 * medShield})`);
            aura.addColorStop(1, `rgba(255, 40, 40, 0)`);
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(n.x, n.y, auraR * medShield, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = medShield > 0.3 ? "#ff3a3a" : "#cc4444";
          ctx.shadowBlur = 8 + medShield * 14;
          ctx.shadowColor = "#ff4040";
        } else {
          ctx.fillStyle = "rgba(140, 170, 255, 0.7)";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#6688ff";
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

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
      style={{ background: "#050505", width: "100vw", height: "100vh", overflow: "hidden", position: "relative", cursor: "pointer", userSelect: "none" }}
      onPointerDown={() => setMediation(true)}
      onPointerUp={() => setMediation(false)}
      onPointerLeave={() => setMediation(false)}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "monospace", color: "#fff", pointerEvents: "none", fontSize: 12, letterSpacing: 2 }}>
        <p style={{ opacity: 0.4, marginBottom: 8 }}>EXPERIMENT / 02</p>
        <p style={{ fontWeight: 600, color: mediation ? "#ff4444" : "#8899ee", transition: "color 0.6s" }}>
          {mediation ? "[ MEDIATION ACTIVE ]" : "[ ASSIMILATION PRESSURE: HIGH ]"}
        </p>
      </div>

      <div style={{ position: "absolute", bottom: 48, left: 48, fontSize: 12, color: "rgba(255,255,255,0.3)", pointerEvents: "none", lineHeight: 1.8, maxWidth: 340 }}>
        Hold click to deploy AI-mediated protection around the minority.
      </div>
    </div>
  );
}
