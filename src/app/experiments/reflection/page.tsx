"use client";

import { useEffect, useRef, useState } from "react";

// Reflective Topography v4: "Who Gets to Speak?" — Participation Asymmetry Visualizer
//
// Visualizes the invisible dynamics of group discussion:
// who dominates, who stays silent, and how AI can surface those inequalities.
//
// Agents sit around a shared discussion space.
// Each has a "speaking time" bar. Some speak a lot, others are silent.
// Lines pulse when two people are in dialogue.
// Clicking near a silent agent "amplifies" their voice (AI moderation).
// Watch the dominant voices, then rebalance the conversation.

const EMOJIS = ["🧑", "👩", "👨", "🧔", "👩‍🦱", "👨‍🦳", "🧕", "👱"];
const N_AGENTS = 8;

interface Speaker {
  id: number;
  x: number; y: number;
  emoji: string;
  speakingTime: number;   // 0–1, cumulative share of talk time
  isSpeaking: boolean;
  speakCooldown: number;
  amplified: boolean;     // boosted by AI moderator
  amplifyLife: number;
}

interface DialogueLine {
  a: Speaker; b: Speaker;
  life: number;
}

export default function ReflectionExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantIdx, setDominantIdx] = useState<number | null>(null);
  const [silentIdx, setSilentIdx] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.32;

    // Place agents in a circle
    const speakers: Speaker[] = Array.from({ length: N_AGENTS }, (_, i) => {
      const angle = (i / N_AGENTS) * Math.PI * 2 - Math.PI / 2;
      // Pre-assign unequal speaking times to simulate real meetings
      const biasedTime = i < 2 ? 0.25 + Math.random() * 0.15   // Two dominant voices
        : i < 5 ? 0.06 + Math.random() * 0.08 // Mid-tier
        : 0.01 + Math.random() * 0.03;          // Silent voices

      return {
        id: i,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        emoji: EMOJIS[i % EMOJIS.length],
        speakingTime: biasedTime,
        isSpeaking: false,
        speakCooldown: Math.random() * 180,
        amplified: false,
        amplifyLife: 0,
      };
    });

    const dialogueLines: DialogueLine[] = [];
    let raf: number;
    let time = 0;

    const onClick = (e: MouseEvent) => {
      // Find nearest silent/low-speaker to amplify
      let nearest: Speaker | null = null;
      let minDist = 80;
      for (const s of speakers) {
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = s; }
      }
      if (nearest) {
        nearest.amplified = true;
        nearest.amplifyLife = 300; // frames
        // Boost their speaking time dramatically
        nearest.speakingTime = Math.min(1, nearest.speakingTime + 0.1);
      }
    };

    window.addEventListener("click", onClick);

    const tick = () => {
      time++;
      ctx.fillStyle = "rgba(5,6,10,0.85)";
      ctx.fillRect(0, 0, W, H);

      // --- Simulate speaking turns ---
      for (const s of speakers) {
        s.speakCooldown--;
        if (s.speakCooldown <= 0 && !s.isSpeaking) {
          // More talk-time = more likely to speak next
          const prob = (s.amplified ? 0.5 : s.speakingTime + 0.02);
          if (Math.random() < prob * 0.04) {
            s.isSpeaking = true;
            const speakDuration = s.amplified
              ? 80 + Math.random() * 100
              : 30 + Math.random() * (s.speakingTime * 120);
            setTimeout(() => { s.isSpeaking = false; s.speakCooldown = 60 + Math.random() * 120; }, speakDuration * 16);

            // Create dialogue line to a random other speaker
            const others = speakers.filter(o => o !== s && o.isSpeaking);
            if (others.length > 0) {
              const target = others[Math.floor(Math.random() * others.length)];
              dialogueLines.push({ a: s, b: target, life: 1.0 });
            }

            // Update speaking time share
            s.speakingTime = Math.min(1, s.speakingTime + 0.008);
          }
        }

        // Normalize all speaking times (zero-sum)
        const total = speakers.reduce((sum, sp) => sum + sp.speakingTime, 0);
        if (total > 1) {
          for (const sp of speakers) sp.speakingTime /= total;
        }

        if (s.amplifyLife > 0) s.amplifyLife--;
        else if (s.amplifyLife === 0 && s.amplified) s.amplified = false;
      }

      // Find dominant and silent speakers every 60 frames
      if (time % 60 === 0) {
        const sorted = [...speakers].sort((a, b) => b.speakingTime - a.speakingTime);
        setDominantIdx(sorted[0].id);
        setSilentIdx(sorted[sorted.length - 1].id);
      }

      // --- Draw center "discussion table" oval ---
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 0.45, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100, 120, 200, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(20, 25, 50, 0.4)";
      ctx.fill();

      ctx.font = "12px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.textAlign = "center";
      ctx.fillText("GROUP DISCUSSION", cx, cy);
      ctx.textAlign = "left";

      // --- Draw dialogue lines ---
      for (let i = dialogueLines.length - 1; i >= 0; i--) {
        const line = dialogueLines[i];
        line.life -= 0.008;
        if (line.life <= 0) { dialogueLines.splice(i, 1); continue; }

        // Animated dash
        const dashOffset = time * 2;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(line.a.x, line.a.y);
        ctx.lineTo(line.b.x, line.b.y);
        ctx.strokeStyle = `rgba(150, 200, 255, ${line.life * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }

      // --- Draw speaker arc bars (speaking time = arc size) ---
      for (const s of speakers) {
        const angle = (s.id / N_AGENTS) * Math.PI * 2 - Math.PI / 2;
        const barR = radius + 22;
        const arcSpan = s.speakingTime * Math.PI * 0.7; // max arc per person

        // Background arc (muted)
        ctx.beginPath();
        ctx.arc(cx, cy, barR, angle - 0.3, angle + 0.3);
        ctx.strokeStyle = "rgba(80, 90, 120, 0.25)";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Filled arc (actual speaking share)
        const hue = 200 + s.speakingTime * 80; // blue -> purple -> pink for heavy speakers
        ctx.beginPath();
        ctx.arc(cx, cy, barR, angle - arcSpan / 2, angle + arcSpan / 2);
        ctx.strokeStyle = s.amplified
          ? `rgba(80, 255, 180, 0.9)`   // Green for AI-amplified
          : `hsla(${hue}, 80%, 65%, ${0.5 + s.speakingTime * 0.5})`;
        ctx.lineWidth = s.isSpeaking ? 9 : 5;
        ctx.stroke();
      }

      // --- Draw agent nodes ---
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const s of speakers) {
        // Amplify ring
        if (s.amplified && s.amplifyLife > 0) {
          const pct = s.amplifyLife / 300;
          const ringR = 20 + Math.sin(time * 0.12) * 5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(80, 255, 180, ${pct * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Speaking pulse circle
        if (s.isSpeaking) {
          const pulse = 16 + Math.sin(time * 0.2) * 4;
          ctx.beginPath();
          ctx.arc(s.x, s.y, pulse, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(160, 200, 255, 0.15)";
          ctx.fill();
        }

        // Agent emoji
        const scale = 0.85 + s.speakingTime * 0.5;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(scale, scale);
        ctx.fillText(s.emoji, 0, 0);
        ctx.restore();

        // Speaking time label
        ctx.font = "9px monospace";
        ctx.fillStyle = s.amplified ? "rgba(80,255,180,0.7)" : "rgba(255,255,255,0.3)";
        ctx.fillText(`${Math.round(s.speakingTime * 100)}%`, s.x, s.y + 20);
        ctx.font = "22px serif";
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div style={{ background: "#05060a", width: "100vw", height: "100vh", overflow: "hidden", position: "relative", cursor: "crosshair" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "monospace", color: "#fff", pointerEvents: "none", fontSize: 12, letterSpacing: 2 }}>
        <p style={{ opacity: 0.4, marginBottom: 8 }}>EXPERIMENT / 03</p>
        <p style={{ color: "#8899ee" }}>
          DOMINANT: <span style={{ color: "#ff9999" }}>Agent {(dominantIdx ?? 0) + 1}</span>
          {"   "}
          SILENT: <span style={{ color: "rgba(255,255,255,0.4)" }}>Agent {(silentIdx ?? 7) + 1}</span>
        </p>
      </div>

      <div style={{ position: "absolute", bottom: 48, left: 48, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", pointerEvents: "none", lineHeight: 1.8, maxWidth: 420 }}>
        <span style={{ color: "rgba(80,255,180,0.7)" }}>●</span> Click near a silent agent to amplify their voice (AI moderation).<br />
        Arc size = talk-time share. Pulsing = currently speaking.
      </div>
    </div>
  );
}
