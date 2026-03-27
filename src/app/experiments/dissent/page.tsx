"use client";

import { useEffect, useRef, useState } from "react";

// Dissent — "Constellation Pressure"
// Fewer, larger nodes in a cosmic aesthetic.
// Majority = soft blue orbs with breathing animation.
// Minority = distinct crimson star-shaped nodes.
// Hold to deploy shimmering shield around minority.

interface Node {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  isMinority: boolean;
  radius: number;
  phase: number;    // animation offset
  targetX: number;
  targetY: number;
}

interface Edge {
  source: Node;
  target: Node;
}

const N_NODES = 45;
const N_MINORITY = 5;

// Gentle physics
const REPULSION = 400;
const ATTRACTION = 0.003;
const DAMPING = 0.93;
const CENTER_FORCE = 0.005;
const REST_LEN = 80;

// Star background particles
interface StarParticle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  phase: number;
}

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

    // Background stars
    const stars: StarParticle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.3 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));

    const nodes: Node[] = Array.from({ length: N_NODES }, (_, i) => {
      const angle = (i / N_NODES) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 80 + Math.random() * Math.min(W, H) * 0.28;
      return {
        id: i,
        x: W / 2 + Math.cos(angle) * dist,
        y: H / 2 + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        isMinority: i < N_MINORITY,
        radius: i < N_MINORITY ? 9 : 5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        targetX: 0, targetY: 0,
      };
    });

    // Set initial targets
    nodes.forEach(n => { n.targetX = n.x; n.targetY = n.y; });

    const edges: Edge[] = [];
    for (let i = 0; i < N_NODES; i++) {
      for (let j = i + 1; j < N_NODES; j++) {
        const n1 = nodes[i], n2 = nodes[j];
        let prob = 0;
        if (!n1.isMinority && !n2.isMinority) prob = 0.08;
        if (n1.isMinority && n2.isMinority) prob = 0.55;
        if (n1.isMinority !== n2.isMinority) prob = 0.012;
        if (Math.random() < prob) edges.push({ source: n1, target: n2 });
      }
    }

    let raf: number;
    let time = 0;
    let medShield = 0;

    const tick = () => {
      time++;
      const isMed = medRef.current;

      medShield += isMed ? 0.012 : -0.01;
      medShield = Math.max(0, Math.min(1, medShield));

      // Dark background with slight fade (trails)
      ctx.fillStyle = "rgba(6, 6, 12, 0.18)";
      ctx.fillRect(0, 0, W, H);

      // Draw stars
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        const twinkle = Math.sin(time * 0.02 + s.phase) * 0.1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 180, 220, ${s.alpha + twinkle})`;
        ctx.fill();
      }

      // Force calculation
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
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

          // Shield pushes majority away from minority
          if (n1.isMinority && !n2.isMinority && dist < 200) {
            repulse += (medShield * 45) / distSq;
          }

          fx += (dx / dist) * repulse;
          fy += (dy / dist) * repulse;
        }

        n1.vx += fx; n1.vy += fy;
      }

      // Spring forces
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
        if (n.x < 50) n.vx += 1; if (n.x > W - 50) n.vx -= 1;
        if (n.y < 50) n.vy += 1; if (n.y > H - 50) n.vy -= 1;
      }

      // Draw edges — curved bezier connections
      for (const edge of edges) {
        const isMinEdge = edge.source.isMinority || edge.target.isMinority;
        const mx2 = (edge.source.x + edge.target.x) / 2;
        const my2 = (edge.source.y + edge.target.y) / 2;
        const cpx = mx2 + Math.sin(time * 0.006 + edge.source.id) * 15;
        const cpy = my2 + Math.cos(time * 0.006 + edge.target.id) * 15;

        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.quadraticCurveTo(cpx, cpy, edge.target.x, edge.target.y);

        if (isMinEdge) {
          const intensity = 0.08 + medShield * 0.35;
          ctx.strokeStyle = `rgba(255, 70, 70, ${intensity})`;
          ctx.lineWidth = 0.6 + medShield * 0.8;
        } else {
          ctx.strokeStyle = "rgba(80, 120, 220, 0.06)";
          ctx.lineWidth = 0.4;
        }
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const breathe = Math.sin(time * 0.02 + n.phase) * 0.15;
        const r = n.radius * (1 + breathe);

        if (n.isMinority) {
          // Shield aura
          if (medShield > 0.05) {
            const auraR = 30 + Math.sin(time * 0.03 + n.phase) * 8;
            const aura = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, auraR * medShield);
            aura.addColorStop(0, `rgba(255, 50, 50, ${0.15 * medShield})`);
            aura.addColorStop(0.5, `rgba(255, 80, 60, ${0.08 * medShield})`);
            aura.addColorStop(1, "rgba(255, 40, 40, 0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(n.x, n.y, auraR * medShield, 0, Math.PI * 2);
            ctx.fill();

            // Shield ring
            ctx.beginPath();
            ctx.arc(n.x, n.y, auraR * medShield * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 120, 80, ${0.2 * medShield})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Star shape for minority
          drawStar(ctx, n.x, n.y, r, r * 0.5, 5, time * 0.01 + n.phase);
          ctx.fillStyle = medShield > 0.3
            ? `rgba(255, 60, 60, ${0.85 + breathe * 0.1})`
            : `rgba(200, 60, 60, ${0.7 + breathe * 0.1})`;
          ctx.fill();

          // Inner glow
          ctx.shadowBlur = 6 + medShield * 10;
          ctx.shadowColor = "rgba(255, 60, 40, 0.7)";
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Majority: soft blue orb with gradient
          const grad = ctx.createRadialGradient(
            n.x - r * 0.25, n.y - r * 0.25, 0,
            n.x, n.y, r
          );
          grad.addColorStop(0, `rgba(140, 180, 255, ${0.7 + breathe * 0.15})`);
          grad.addColorStop(1, `rgba(80, 110, 200, ${0.35 + breathe * 0.1})`);

          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(100, 140, 255, 0.4)";
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    // Initial fill
    ctx.fillStyle = "#06060c";
    ctx.fillRect(0, 0, W, H);

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
      style={{ background: "#06060c", width: "100vw", height: "100vh", overflow: "hidden", position: "relative", cursor: "pointer", userSelect: "none" }}
      onPointerDown={() => setMediation(true)}
      onPointerUp={() => setMediation(false)}
      onPointerLeave={() => setMediation(false)}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "'Inter', monospace", color: "#fff", pointerEvents: "none", fontSize: 11, letterSpacing: 2.5 }}>
        <p style={{ opacity: 0.35, marginBottom: 6, fontSize: 10 }}>EXPERIMENT / 02</p>
        <p style={{
          fontWeight: 500,
          color: mediation ? "#ff4444" : "#a8b4e8",
          transition: "color 0.6s ease",
        }}>
          {mediation ? "[ MEDIATION ACTIVE ]" : "[ ASSIMILATION PRESSURE: HIGH ]"}
        </p>
      </div>

      <div style={{
        position: "absolute", bottom: 48, left: 48,
        fontFamily: "'Inter', monospace", fontSize: 10,
        color: "rgba(255,255,255,0.25)", pointerEvents: "none",
        lineHeight: 2, maxWidth: 360, letterSpacing: 0.5,
      }}>
        <span style={{ color: "rgba(255,70,70,0.6)" }}>★</span>{" "}Minority — distinct dissenting voices<br />
        <span style={{ color: "rgba(120,160,255,0.6)" }}>●</span>{" "}Majority — conforming cluster<br />
        <span style={{ opacity: 0.5 }}>Hold to deploy AI-mediated protection shield</span>
      </div>
    </div>
  );
}

// Helper: draw star shape
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number, rotation: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = rotation + (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
