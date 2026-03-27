"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Social Field Theory v3: Human Emoji Network + AI Agent Injection
// People emojis (diverse) form the social field nodes.
// A robot emoji (🤖) represents the AI agent dropped into the field.
// Ties between humans stretch and heat up (blue -> orange/red) under AI gravity.
// Physics: slow, deliberate, impactful.

const PEOPLE = ["🧑", "👩", "👨", "🧔", "👩‍🦱", "👨‍🦳", "🧕", "👱", "🧑‍🦲", "👴", "👵", "🧑‍🦰"];
const SPACING = 90;
const SPRING_K = 0.006;
const ANCHOR_K = 0.0008;
const DAMPING = 0.94;
const GRAVITY = 3500;
const EMOJI_SIZE = 16;

interface HumanNode {
  ox: number; oy: number;
  x: number; y: number;
  vx: number; vy: number;
  emoji: string;
}

interface SocialTie {
  a: HumanNode;
  b: HumanNode;
  restLength: number;
}

interface AIAgent {
  id: number;
  x: number; y: number;
  mass: number;
  life: number;
  age: number; // incremented per frame
}

export default function SocialFieldExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const agentsRef = useRef<AIAgent[]>([]);
  const idCounter = useRef(0);

  useEffect(() => { agentsRef.current = agents; }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    // Build human nodes grid
    const nodes: HumanNode[] = [];
    const ties: SocialTie[] = [];

    const cols = Math.floor(W / SPACING) + 1;
    const rows = Math.floor(H / SPACING) + 1;
    const offX = (W - (cols - 1) * SPACING) / 2;
    const offY = (H - (rows - 1) * SPACING) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          ox: offX + c * SPACING,
          oy: offY + r * SPACING,
          x: offX + c * SPACING,
          y: offY + r * SPACING,
          vx: 0, vy: 0,
          emoji: PEOPLE[Math.floor(Math.random() * PEOPLE.length)],
        });
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (c < cols - 1) ties.push({ a: nodes[i], b: nodes[i + 1], restLength: SPACING });
        if (r < rows - 1) ties.push({ a: nodes[i], b: nodes[i + cols], restLength: SPACING });
      }
    }

    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      // Atmospheric gradient background
      ctx.fillStyle = "#060a0f";
      ctx.fillRect(0, 0, W, H);

      const currentAgents = agentsRef.current;

      // Advance agent ages
      currentAgents.forEach(a => {
        a.age++;
        a.life -= 0.0008; // Very slow decay
        a.mass = Math.max(0, a.life);
      });

      // 1. Forces on humans
      for (const n of nodes) {
        let fx = (n.ox - n.x) * ANCHOR_K;
        let fy = (n.oy - n.y) * ANCHOR_K;

        for (const ag of currentAgents) {
          if (ag.age < 15) continue; // wait for landing animation
          const ramp = Math.min(1, (ag.age - 15) / 80);
          const dx = ag.x - n.x;
          const dy = ag.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 50) {
            const pull = (GRAVITY * ag.mass * ramp) / distSq;
            const d = Math.sqrt(distSq);
            fx += (dx / d) * pull;
            fy += (dy / d) * pull;
          }
        }
        n.vx += fx; n.vy += fy;
      }

      // 2. Spring forces
      for (const tie of ties) {
        const dx = tie.b.x - tie.a.x;
        const dy = tie.b.y - tie.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - tie.restLength) * SPRING_K;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        tie.a.vx += fx; tie.a.vy += fy;
        tie.b.vx -= fx; tie.b.vy -= fy;
      }

      // 3. Update positions
      for (const n of nodes) {
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;
      }

      // 4. Draw ties with heat coloring
      for (const tie of ties) {
        const dx = tie.b.x - tie.a.x;
        const dy = tie.b.y - tie.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stretch = Math.max(0, dist - tie.restLength);
        const heat = Math.min(1.0, stretch / 30);
        const hue = 210 - heat * 200;
        const alpha = 0.12 + heat * 0.55;
        ctx.strokeStyle = `hsla(${hue}, 100%, ${55 + heat * 25}%, ${alpha})`;
        ctx.lineWidth = 0.6 + heat * 1.8;
        ctx.beginPath();
        ctx.moveTo(tie.a.x, tie.a.y);
        ctx.lineTo(tie.b.x, tie.b.y);
        ctx.stroke();
      }

      // 5. Draw human emojis
      ctx.font = `${EMOJI_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const n of nodes) {
        ctx.fillText(n.emoji, n.x, n.y);
      }

      // 6. Draw AI agents (robot emoji + glow + shockwave on land)
      for (const ag of currentAgents) {
        // Landing shockwave (first 40 frames)
        if (ag.age < 50) {
          const t = ag.age / 50;
          const ringR = t * 120;
          ctx.beginPath();
          ctx.arc(ag.x, ag.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 140, 0, ${(1 - t) * 0.8})`;
          ctx.lineWidth = 2.5 - t * 2;
          ctx.stroke();

          // Second inner ring
          if (ag.age > 10) {
            const t2 = (ag.age - 10) / 40;
            ctx.beginPath();
            ctx.arc(ag.x, ag.y, t2 * 60, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 200, 50, ${(1 - t2) * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Persistent glow halo
        const activeScale = Math.min(1, ag.age / 80);
        const glowR = 50 * ag.mass * activeScale;
        if (glowR > 1) {
          const glow = ctx.createRadialGradient(ag.x, ag.y, 0, ag.x, ag.y, glowR);
          glow.addColorStop(0, `rgba(255, 160, 0, ${0.35 * activeScale})`);
          glow.addColorStop(1, "rgba(255, 80, 0, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(ag.x, ag.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Robot emoji, scaled with life
        const botSize = 24 + 8 * activeScale;
        ctx.font = `${botSize}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🤖", ag.x, ag.y);

        // Subtle rotating dashed orbit ring
        if (activeScale > 0.2) {
          ctx.save();
          ctx.translate(ag.x, ag.y);
          ctx.rotate(ag.age * 0.025);
          ctx.beginPath();
          ctx.setLineDash([4, 8]);
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 160, 0, ${0.25 * activeScale})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // Cleanup dead agents
      if (currentAgents.some(a => a.life <= 0)) {
        setAgents(prev => prev.filter(a => a.life > 0));
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    idCounter.current += 1;
    setAgents(prev => [...prev, {
      id: idCounter.current,
      x: e.clientX,
      y: e.clientY,
      mass: 1.0,
      life: 1.0,
      age: 0,
    }]);
  }, []);

  return (
    <div
      style={{ background: "#060a0f", width: "100vw", height: "100vh", overflow: "hidden", position: "relative", cursor: "crosshair", userSelect: "none" }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div ref={overlayRef} />

      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "monospace", color: "#fff", pointerEvents: "none", fontSize: 12, letterSpacing: 2 }}>
        <p style={{ opacity: 0.4, marginBottom: 8 }}>EXPERIMENT / 04</p>
        <p style={{ fontWeight: 600, color: "#ff8c00" }}>
          {"[ CLICK TO INJECT AI AGENT 🤖 ]"}
        </p>
      </div>

      <div style={{ position: "absolute", bottom: 48, left: 48, fontSize: 12, color: "rgba(255,255,255,0.3)", pointerEvents: "none", lineHeight: 1.8, maxWidth: 380 }}>
        The social field — formed by people — bends under AI gravitational force.
        <br />
        Ties glow orange-red as they stretch under displacement.
      </div>
    </div>
  );
}
