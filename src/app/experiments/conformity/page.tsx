"use client";

import { useEffect, useRef, useState } from "react";

// Conformity — "Opinion Wave"
// Agents arranged organically. Conformity pressure ripples outward like waves.
// Mouse hover = AI Dissenter: shields nearby agents from the majority pull.
// Colors: independent = cyan/mint, conforming = lavender → rose gradient.

interface Agent {
  x: number; y: number;
  angle: number;           // true private belief
  displayAngle: number;    // public display (pulled by conformity)
  conformity: number;      // 0 = independent, 1 = fully conforming
  confidence: number;
  id: number;
  phase: number;           // animation phase offset
  baseRadius: number;
}

const N = 60;
const MAJORITY_ANGLE = Math.PI / 6;
const TRUE_ANGLE = -Math.PI / 3;

export default function ConformityExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [conformityPct, setConformityPct] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    let mx = -999, my = -999;

    // Place agents in organic clusters using golden-angle spiral + jitter
    const agents: Agent[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(i / N) * Math.min(W, H) * 0.34;
      const theta = i * goldenAngle;
      const cx = W / 2 + Math.cos(theta) * r + (Math.random() - 0.5) * 40;
      const cy = H / 2 + Math.sin(theta) * r + (Math.random() - 0.5) * 40;
      const isMinority = i < 8;
      agents.push({
        id: i,
        x: cx, y: cy,
        angle: isMinority ? TRUE_ANGLE : MAJORITY_ANGLE + (Math.random() - 0.5) * 0.4,
        displayAngle: isMinority ? TRUE_ANGLE : MAJORITY_ANGLE,
        conformity: isMinority ? 0 : 0.6 + Math.random() * 0.35,
        confidence: isMinority ? 0.8 : 0.15 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        baseRadius: 6 + Math.random() * 4,
      });
    }

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onLeave = () => { mx = -999; my = -999; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let raf: number;
    let time = 0;

    // Ripple system for conformity waves
    const ripples: { x: number; y: number; r: number; life: number; maxR: number }[] = [];

    const tick = () => {
      time++;
      // Subtle fade trail
      ctx.fillStyle = "rgba(8, 8, 16, 0.12)";
      ctx.fillRect(0, 0, W, H);

      // Occasionally spawn conformity ripples from high-conformity agents
      if (time % 90 === 0) {
        const source = agents[Math.floor(Math.random() * agents.length)];
        if (source.conformity > 0.5) {
          ripples.push({ x: source.x, y: source.y, r: 0, life: 1, maxR: 180 + Math.random() * 80 });
        }
      }

      // Update & draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += 1.2;
        rip.life = Math.max(0, 1 - rip.r / rip.maxR);
        if (rip.life <= 0) { ripples.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 140, 220, ${rip.life * 0.12})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Physics
      let totalConformity = 0;
      for (const ag of agents) {
        const dxC = mx - ag.x, dyC = my - ag.y;
        const distCursor = Math.sqrt(dxC * dxC + dyC * dyC);
        const aiProximity = Math.max(0, 1 - distCursor / 160);

        ag.confidence += (aiProximity * 0.9 + 0.05 - ag.confidence) * 0.03;
        ag.confidence = Math.max(0.05, Math.min(1, ag.confidence));

        // Ripple-enhanced conformity pressure
        let rippleBoost = 0;
        for (const rip of ripples) {
          const dx = ag.x - rip.x, dy = ag.y - rip.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(d - rip.r) < 30) {
            rippleBoost += rip.life * 0.15;
          }
        }

        let majorCount = 0, minorCount = 0;
        for (const nb of agents) {
          if (nb === ag) continue;
          const dx = nb.x - ag.x, dy = nb.y - ag.y;
          if (Math.sqrt(dx * dx + dy * dy) > 160) continue;
          const angleDiff = Math.abs(nb.displayAngle - MAJORITY_ANGLE);
          if (angleDiff < 0.5) majorCount++; else minorCount++;
        }

        const socialPressure = majorCount / (majorCount + minorCount + 1) + rippleBoost;
        const target = Math.min(1, socialPressure) * (1 - ag.confidence * 0.85);
        ag.conformity += (target - ag.conformity) * 0.005;
        ag.conformity = Math.max(0, Math.min(1, ag.conformity));

        const targetDisplay = ag.angle * (1 - ag.conformity) + MAJORITY_ANGLE * ag.conformity;
        ag.displayAngle += (targetDisplay - ag.displayAngle) * 0.03;

        totalConformity += ag.conformity;
      }

      if (time % 30 === 0) setConformityPct(Math.round((totalConformity / N) * 100));

      // Draw bezier connections between nearby agents
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const a = agents[i], b = agents[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 130) continue;

          const sharedConf = (a.conformity + b.conformity) / 2;
          const midX = (a.x + b.x) / 2 + Math.sin(time * 0.01 + i) * 12;
          const midY = (a.y + b.y) / 2 + Math.cos(time * 0.01 + j) * 12;

          const fade = 1 - dist / 130;
          // Color: independent connections=cyan, conforming=lavender
          const r2 = Math.round(100 + sharedConf * 120);
          const g2 = Math.round(200 - sharedConf * 80);
          const b2 = Math.round(255 - sharedConf * 20);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(midX, midY, b.x, b.y);
          ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${fade * 0.08 + sharedConf * 0.06})`;
          ctx.lineWidth = 0.5 + sharedConf * 0.5;
          ctx.stroke();
        }
      }

      // AI Dissenter glow zone
      if (mx > 0) {
        const pulse = Math.sin(time * 0.04) * 10;
        const radius = 160 + pulse;

        // Outer glow
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
        g.addColorStop(0, "rgba(60, 230, 180, 0.07)");
        g.addColorStop(0.5, "rgba(60, 230, 180, 0.03)");
        g.addColorStop(1, "rgba(60, 230, 180, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, radius, 0, Math.PI * 2);
        ctx.fill();

        // Spinning ring
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(time * 0.008);
        ctx.setLineDash([8, 16]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(60, 230, 180, ${0.12 + Math.sin(time * 0.06) * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Label
        ctx.font = "9px 'Inter', monospace";
        ctx.fillStyle = "rgba(60, 230, 180, 0.5)";
        ctx.textAlign = "center";
        ctx.fillText("AI DISSENTER", mx, my - 28);
        ctx.textAlign = "left";
      }

      // Draw agents
      for (const ag of agents) {
        const isMinority = ag.conformity < 0.3;
        const dxC = mx - ag.x, dyC = my - ag.y;
        const aiBoost = Math.max(0, 1 - Math.sqrt(dxC * dxC + dyC * dyC) / 160);
        const breathe = Math.sin(time * 0.025 + ag.phase) * 0.15;

        const radius = ag.baseRadius * (1 + breathe);

        // Agent gradient: cyan(independent) → lavender/rose(conforming)
        const r = Math.round(isMinority ? 40 + aiBoost * 40 : 160 + ag.conformity * 60);
        const gC = Math.round(isMinority ? 210 + aiBoost * 45 : 130 - ag.conformity * 50);
        const bC = Math.round(isMinority ? 200 : 220 + ag.conformity * 35);
        const alpha = 0.4 + ag.confidence * 0.5;

        // Outer glow for independent agents near cursor
        if (isMinority && aiBoost > 0.15) {
          const glowR = radius + 10 + aiBoost * 8;
          const glow = ctx.createRadialGradient(ag.x, ag.y, radius * 0.5, ag.x, ag.y, glowR);
          glow.addColorStop(0, `rgba(60, 230, 180, ${0.2 * aiBoost})`);
          glow.addColorStop(1, "rgba(60, 230, 180, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(ag.x, ag.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Agent body
        const bodyGrad = ctx.createRadialGradient(
          ag.x - radius * 0.3, ag.y - radius * 0.3, 0,
          ag.x, ag.y, radius
        );
        bodyGrad.addColorStop(0, `rgba(${r + 40}, ${gC + 30}, ${bC}, ${alpha + 0.2})`);
        bodyGrad.addColorStop(1, `rgba(${r}, ${gC}, ${bC}, ${alpha * 0.6})`);

        ctx.beginPath();
        ctx.arc(ag.x, ag.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Direction indicator — soft tapered line
        const arrowLen = radius + 12 + ag.confidence * 4;
        const ax = ag.x + Math.cos(ag.displayAngle) * arrowLen;
        const ay = ag.y + Math.sin(ag.displayAngle) * arrowLen;

        const grad = ctx.createLinearGradient(ag.x, ag.y, ax, ay);
        grad.addColorStop(0, `rgba(${r}, ${gC}, ${bC}, ${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(${r}, ${gC}, ${bC}, 0)`);

        ctx.beginPath();
        ctx.moveTo(ag.x, ag.y);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Subtle ambient particles
      if (time % 3 === 0) {
        const px = Math.random() * W;
        const py = Math.random() * H;
        ctx.beginPath();
        ctx.arc(px, py, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(140, 160, 220, 0.15)";
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    // Initial clear
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, W, H);

    tick();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div style={{ background: "#080810", width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "'Inter', monospace", color: "#fff", pointerEvents: "none", fontSize: 11, letterSpacing: 2.5 }}>
        <p style={{ opacity: 0.35, marginBottom: 6, fontSize: 10 }}>EXPERIMENT / 01</p>
        <p style={{ color: "#a8b4e8", fontWeight: 500 }}>
          CONFORMITY PRESSURE{" "}
          <span style={{
            color: conformityPct > 60 ? "#e87088" : "#6dd8b0",
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.5s ease",
          }}>
            {conformityPct}%
          </span>
        </p>
      </div>

      <div style={{
        position: "absolute", bottom: 48, left: 48,
        fontFamily: "'Inter', monospace", fontSize: 10,
        color: "rgba(255,255,255,0.28)", pointerEvents: "none",
        lineHeight: 2, maxWidth: 400, letterSpacing: 0.5,
      }}>
        <span style={{ color: "rgba(60,230,180,0.55)" }}>●</span>{" "}Independent — resisting majority direction<br />
        <span style={{ color: "rgba(180,140,240,0.55)" }}>●</span>{" "}Conforming — yielding to group norm<br />
        <span style={{ opacity: 0.5 }}>Hover to deploy AI Dissenter field</span>
      </div>
    </div>
  );
}
