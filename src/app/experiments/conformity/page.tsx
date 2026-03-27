"use client";

import { useEffect, useRef, useState } from "react";

// Conformity v4: "The Asch Line Test" — Opinion Cascade
//
// Visualizes Solomon Asch's conformity experiment (1951).
// 50 "participants" each hold an opinion (direction they face).
// The Majority opinion slowly pulls everyone into alignment — even when wrong.
// 
// The user's cursor is the "AI Dissenter": hover near agents to give them
// the confidence to maintain their independent stance.
// Watch the cascade of conformity ripple through the crowd.

interface Agent {
  x: number; y: number;
  angle: number;           // True private belief direction
  displayAngle: number;    // What they publicly show (pulled by conformity)
  conformity: number;      // 0 = fully independent, 1 = fully conforming
  confidence: number;      // boosted by AI proximity
  id: number;
}

const N = 48;
const MAJORITY_ANGLE = Math.PI / 6; // The "wrong" majority opinion direction
const TRUE_ANGLE = -Math.PI / 3;    // The correct, minority view

export default function ConformityExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [conformityPct, setConformityPct] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    let mx = -999, my = -999;

    // Arrange agents in a loose organic scatter
    const agents: Agent[] = Array.from({ length: N }, (_, i) => {
      const col = i % 8, row = Math.floor(i / 8);
      const spacing = Math.min(W, H) * 0.085;
      const startX = W / 2 - spacing * 3.5 + col * spacing;
      const startY = H / 2 - spacing * 2.5 + row * spacing;
      return {
        id: i,
        x: startX + (Math.random() - 0.5) * 30,
        y: startY + (Math.random() - 0.5) * 30,
        angle: i < 6 ? TRUE_ANGLE : MAJORITY_ANGLE + (Math.random() - 0.5) * 0.3,
        displayAngle: i < 6 ? TRUE_ANGLE : MAJORITY_ANGLE,
        conformity: i < 6 ? 0 : 0.7 + Math.random() * 0.3,
        confidence: i < 6 ? 0.8 : 0.2,
      };
    });

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onLeave = () => { mx = -999; my = -999; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let raf: number;
    let time = 0;

    const tick = () => {
      time++;
      ctx.fillStyle = "#060608";
      ctx.fillRect(0, 0, W, H);

      // Compute social pressure on each agent
      let totalConformity = 0;
      for (const ag of agents) {
        const dxC = mx - ag.x, dyC = my - ag.y;
        const distCursor = Math.sqrt(dxC * dxC + dyC * dyC);
        const aiProximity = Math.max(0, 1 - distCursor / 140);

        // AI proximity boosts confidence
        ag.confidence += (aiProximity - ag.confidence) * 0.05;
        ag.confidence = Math.max(0.05, Math.min(1, ag.confidence));

        // Peer pressure: count majority vs minority neighbors
        let majorCount = 0, minorCount = 0;
        for (const nb of agents) {
          if (nb === ag) continue;
          const dx = nb.x - ag.x, dy = nb.y - ag.y;
          if (Math.sqrt(dx * dx + dy * dy) > 180) continue;
          const angleDiff = Math.abs(nb.displayAngle - MAJORITY_ANGLE);
          if (angleDiff < 0.5) majorCount++;
          else minorCount++;
        }

        const socialPressure = majorCount / (majorCount + minorCount + 1);
        // Conformity drifts with social pressure, resisted by AI-boosted confidence
        const target = socialPressure * (1 - ag.confidence * 0.9);
        ag.conformity += (target - ag.conformity) * 0.006;
        ag.conformity = Math.max(0, Math.min(1, ag.conformity));

        // Display angle interpolates between private belief and majority opinion
        const targetDisplay = ag.angle * (1 - ag.conformity) + MAJORITY_ANGLE * ag.conformity;
        ag.displayAngle += (targetDisplay - ag.displayAngle) * 0.04;

        totalConformity += ag.conformity;
      }

      if (time % 30 === 0) setConformityPct(Math.round((totalConformity / N) * 100));

      // Draw influence connections (faint lines between conforming neighbours)
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const a = agents[i], b = agents[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 150) continue;
          const sharedConformity = (a.conformity + b.conformity) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(150, 160, 255, ${sharedConformity * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Draw AI cursor zone
      if (mx > 0) {
        const pulse = Math.sin(time * 0.05) * 8;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 140 + pulse);
        g.addColorStop(0, "rgba(80, 255, 200, 0.06)");
        g.addColorStop(1, "rgba(80, 255, 200, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, 140 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Cursor label
        ctx.font = "10px monospace";
        ctx.fillStyle = "rgba(80, 255, 200, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText("AI DISSENTER", mx, my - 20);
        ctx.textAlign = "left";
      }

      // Draw agents
      for (const ag of agents) {
        const isMinority = ag.conformity < 0.35;
        const dxC = mx - ag.x, dyC = my - ag.y;
        const aiBoost = Math.max(0, 1 - Math.sqrt(dxC * dxC + dyC * dyC) / 140);

        // Agent body circle
        const radius = 8;
        const r = isMinority ? Math.round(60 + aiBoost * 60) : Math.round(130 + ag.conformity * 80);
        const g2 = isMinority ? Math.round(200 + aiBoost * 55) : Math.round(140 - ag.conformity * 60);
        const b2 = 255;

        ctx.beginPath();
        ctx.arc(ag.x, ag.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g2}, ${b2}, ${0.5 + ag.confidence * 0.5})`;
        if (isMinority && aiBoost > 0.1) {
          ctx.shadowBlur = 12 * aiBoost;
          ctx.shadowColor = "rgba(80, 255, 200, 0.8)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arrow showing public opinion direction
        const arrowLen = 18;
        const ax = ag.x + Math.cos(ag.displayAngle) * arrowLen;
        const ay = ag.y + Math.sin(ag.displayAngle) * arrowLen;
        ctx.beginPath();
        ctx.moveTo(ag.x, ag.y);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = `rgba(${r}, ${g2}, ${b2}, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrowhead
        const headLen = 5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - headLen * Math.cos(ag.displayAngle - 0.4),
          ay - headLen * Math.sin(ag.displayAngle - 0.4)
        );
        ctx.lineTo(
          ax - headLen * Math.cos(ag.displayAngle + 0.4),
          ay - headLen * Math.sin(ag.displayAngle + 0.4)
        );
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g2}, ${b2}, 0.9)`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

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
    <div style={{ background: "#060608", width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Legend */}
      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "monospace", color: "#fff", pointerEvents: "none", fontSize: 12, letterSpacing: 2 }}>
        <p style={{ opacity: 0.4, marginBottom: 8 }}>EXPERIMENT / 01</p>
        <p style={{ color: "#8899ee" }}>GROUP CONFORMITY PRESSURE: <span style={{ color: "#ff8888" }}>{conformityPct}%</span></p>
      </div>

      <div style={{ position: "absolute", bottom: 48, left: 48, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", pointerEvents: "none", lineHeight: 1.8, maxWidth: 400 }}>
        <span style={{ color: "rgba(80,255,200,0.6)" }}>●</span> Minority: resisting majority direction<br />
        <span style={{ color: "rgba(130,140,255,0.6)" }}>●</span> Majority: conforming to shared norm<br />
        Hover cursor (AI Dissenter) near agents to protect their private beliefs.
      </div>
    </div>
  );
}
