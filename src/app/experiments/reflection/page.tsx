"use client";

import { useEffect, useRef, useState } from "react";

// Reflection — "Voice Spectrum"
// Visualizes speaking time as beams of light from center.
// Abstract silhouette avatars instead of emojis.
// Sound-wave ring animations when speaking.
// AI amplification: click near silent agent → expanding wave + growing beam.

const N_AGENTS = 8;
const AVATAR_COLORS = [
  "#8b7ec8", "#6b9fd8", "#7cc8b4", "#c8a87c",
  "#c87c8b", "#7c8bc8", "#b4c87c", "#c87cb4"
];

interface Speaker {
  id: number;
  x: number; y: number;
  speakingTime: number;
  isSpeaking: boolean;
  speakCooldown: number;
  amplified: boolean;
  amplifyLife: number;
  color: string;
  phase: number;
  waveRings: { r: number; life: number; }[];
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

    const speakers: Speaker[] = Array.from({ length: N_AGENTS }, (_, i) => {
      const angle = (i / N_AGENTS) * Math.PI * 2 - Math.PI / 2;
      const biasedTime = i < 2 ? 0.25 + Math.random() * 0.15
        : i < 5 ? 0.06 + Math.random() * 0.08
        : 0.01 + Math.random() * 0.03;

      return {
        id: i,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        speakingTime: biasedTime,
        isSpeaking: false,
        speakCooldown: Math.random() * 180,
        amplified: false,
        amplifyLife: 0,
        color: AVATAR_COLORS[i],
        phase: Math.random() * Math.PI * 2,
        waveRings: [],
      };
    });

    const dialogueLines: DialogueLine[] = [];
    let raf: number;
    let time = 0;

    const onClick = (e: MouseEvent) => {
      let nearest: Speaker | null = null;
      let minDist = 90;
      for (const s of speakers) {
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = s; }
      }
      if (nearest) {
        nearest.amplified = true;
        nearest.amplifyLife = 300;
        nearest.speakingTime = Math.min(1, nearest.speakingTime + 0.1);
        // Spawn amplify waves
        for (let k = 0; k < 3; k++) {
          setTimeout(() => {
            nearest!.waveRings.push({ r: 20, life: 1 });
          }, k * 200);
        }
      }
    };

    window.addEventListener("click", onClick);

    const tick = () => {
      time++;
      ctx.fillStyle = "rgba(6, 7, 14, 0.82)";
      ctx.fillRect(0, 0, W, H);

      // Speaking simulation
      for (const s of speakers) {
        s.speakCooldown--;
        if (s.speakCooldown <= 0 && !s.isSpeaking) {
          const prob = (s.amplified ? 0.5 : s.speakingTime + 0.02);
          if (Math.random() < prob * 0.04) {
            s.isSpeaking = true;
            const dur = s.amplified
              ? 80 + Math.random() * 100
              : 30 + Math.random() * (s.speakingTime * 120);
            setTimeout(() => { s.isSpeaking = false; s.speakCooldown = 60 + Math.random() * 120; }, dur * 16);

            const others = speakers.filter(o => o !== s && o.isSpeaking);
            if (others.length > 0) {
              const target = others[Math.floor(Math.random() * others.length)];
              dialogueLines.push({ a: s, b: target, life: 1.0 });
            }

            s.speakingTime = Math.min(1, s.speakingTime + 0.008);

            // Spawn wave ring when speaking starts
            s.waveRings.push({ r: 15, life: 1 });
          }
        }

        const total = speakers.reduce((sum, sp) => sum + sp.speakingTime, 0);
        if (total > 1) {
          for (const sp of speakers) sp.speakingTime /= total;
        }

        if (s.amplifyLife > 0) s.amplifyLife--;
        else if (s.amplifyLife === 0 && s.amplified) s.amplified = false;
      }

      if (time % 60 === 0) {
        const sorted = [...speakers].sort((a, b) => b.speakingTime - a.speakingTime);
        setDominantIdx(sorted[0].id);
        setSilentIdx(sorted[sorted.length - 1].id);
      }

      // Draw center discussion area — soft glowing circle
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.35);
      centerGrad.addColorStop(0, "rgba(30, 35, 60, 0.35)");
      centerGrad.addColorStop(1, "rgba(15, 18, 35, 0)");
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Subtle center ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(80, 100, 160, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "10px 'Inter', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DISCUSSION SPACE", cx, cy);

      // Draw light beams from center to each speaker
      for (const s of speakers) {
        const beamWidth = 2 + s.speakingTime * 25;
        const beamAlpha = 0.05 + s.speakingTime * 0.35;

        // Determine beam color
        let beamColor: string;
        if (s.amplified) {
          beamColor = `rgba(60, 220, 160, ${beamAlpha})`;
        } else if (s.speakingTime > 0.15) {
          // Dominant = purple/pink
          beamColor = `rgba(180, 100, 220, ${beamAlpha})`;
        } else {
          // Silent = blue/cyan
          beamColor = `rgba(80, 140, 220, ${beamAlpha * 0.5})`;
        }

        // Tapered beam using gradient
        const angle = Math.atan2(s.y - cy, s.x - cx);
        const perpX = Math.sin(angle);
        const perpY = -Math.cos(angle);

        ctx.beginPath();
        ctx.moveTo(cx + perpX * 1, cy + perpY * 1);
        ctx.lineTo(cx - perpX * 1, cy - perpY * 1);
        ctx.lineTo(s.x - perpX * beamWidth / 2, s.y - perpY * beamWidth / 2);
        ctx.lineTo(s.x + perpX * beamWidth / 2, s.y + perpY * beamWidth / 2);
        ctx.closePath();

        // Gradient along beam
        const grad = ctx.createLinearGradient(cx, cy, s.x, s.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.3, beamColor);
        grad.addColorStop(1, beamColor);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw dialogue lines
      for (let i = dialogueLines.length - 1; i >= 0; i--) {
        const line = dialogueLines[i];
        line.life -= 0.006;
        if (line.life <= 0) { dialogueLines.splice(i, 1); continue; }

        ctx.setLineDash([4, 10]);
        ctx.lineDashOffset = -time * 1.5;
        ctx.beginPath();
        ctx.moveTo(line.a.x, line.a.y);
        ctx.lineTo(line.b.x, line.b.y);
        ctx.strokeStyle = `rgba(160, 200, 255, ${line.life * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }

      // Draw agents
      for (const s of speakers) {
        const breathe = Math.sin(time * 0.03 + s.phase) * 0.08;

        // Wave rings (sound waves)
        for (let w = s.waveRings.length - 1; w >= 0; w--) {
          const ring = s.waveRings[w];
          ring.r += 0.8;
          ring.life -= 0.012;
          if (ring.life <= 0) { s.waveRings.splice(w, 1); continue; }

          ctx.beginPath();
          ctx.arc(s.x, s.y, ring.r, 0, Math.PI * 2);
          ctx.strokeStyle = s.amplified
            ? `rgba(60, 220, 160, ${ring.life * 0.35})`
            : `rgba(160, 180, 255, ${ring.life * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Amplify glow ring
        if (s.amplified && s.amplifyLife > 0) {
          const pct = s.amplifyLife / 300;
          const ringR = 28 + Math.sin(time * 0.08) * 4;
          const glowGrad = ctx.createRadialGradient(s.x, s.y, ringR - 6, s.x, s.y, ringR + 6);
          glowGrad.addColorStop(0, `rgba(60, 220, 160, ${pct * 0.4})`);
          glowGrad.addColorStop(1, `rgba(60, 220, 160, 0)`);
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, ringR + 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(s.x, s.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(60, 220, 160, ${pct * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Speaking pulse aura
        if (s.isSpeaking) {
          const pulse = 24 + Math.sin(time * 0.15) * 5;
          const aura = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, pulse);
          aura.addColorStop(0, `rgba(200, 220, 255, 0.12)`);
          aura.addColorStop(1, `rgba(200, 220, 255, 0)`);
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(s.x, s.y, pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Avatar silhouette — abstract person shape using circles
        const avatarR = 15 + s.speakingTime * 8;
        const scale = 1 + breathe;

        // Head
        const headR = avatarR * 0.35 * scale;
        const headY = s.y - avatarR * 0.25 * scale;
        ctx.beginPath();
        ctx.arc(s.x, headY, headR, 0, Math.PI * 2);
        const headGrad = ctx.createRadialGradient(s.x - headR * 0.2, headY - headR * 0.2, 0, s.x, headY, headR);
        headGrad.addColorStop(0, s.amplified ? "rgba(80, 240, 180, 0.9)" : s.color);
        headGrad.addColorStop(1, s.amplified ? "rgba(40, 180, 120, 0.5)" : s.color + "60");
        ctx.fillStyle = headGrad;
        ctx.fill();

        // Body (wider ellipse)
        const bodyY = s.y + avatarR * 0.18 * scale;
        const bodyW = avatarR * 0.45 * scale;
        const bodyH = avatarR * 0.35 * scale;
        ctx.beginPath();
        ctx.ellipse(s.x, bodyY, bodyW, bodyH, 0, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();

        // Speaking time label
        ctx.font = "9px 'Inter', monospace";
        ctx.fillStyle = s.amplified
          ? "rgba(60,220,160,0.7)"
          : `rgba(255,255,255,${0.2 + s.speakingTime * 0.5})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${Math.round(s.speakingTime * 100)}%`, s.x, s.y + avatarR * 0.72);
      }

      // Outer ring (speaking time arcs)
      const arcR = radius + 28;
      for (const s of speakers) {
        const angle = (s.id / N_AGENTS) * Math.PI * 2 - Math.PI / 2;
        const arcSpan = s.speakingTime * Math.PI * 0.65;

        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, angle - 0.25, angle + 0.25);
        ctx.strokeStyle = "rgba(60, 70, 100, 0.15)";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Filled arc
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, angle - arcSpan / 2, angle + arcSpan / 2);
        if (s.amplified) {
          ctx.strokeStyle = "rgba(60, 220, 160, 0.8)";
        } else if (s.speakingTime > 0.15) {
          ctx.strokeStyle = `rgba(180, 100, 220, ${0.4 + s.speakingTime * 0.5})`;
        } else {
          ctx.strokeStyle = `rgba(80, 140, 220, ${0.25 + s.speakingTime * 0.4})`;
        }
        ctx.lineWidth = s.isSpeaking ? 7 : 4;
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };

    // Initial fill
    ctx.fillStyle = "#06070e";
    ctx.fillRect(0, 0, W, H);

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
    <div style={{ background: "#06070e", width: "100vw", height: "100vh", overflow: "hidden", position: "relative", cursor: "crosshair" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      <div style={{ position: "absolute", top: 40, left: 48, fontFamily: "'Inter', monospace", color: "#fff", pointerEvents: "none", fontSize: 11, letterSpacing: 2.5 }}>
        <p style={{ opacity: 0.35, marginBottom: 6, fontSize: 10 }}>EXPERIMENT / 03</p>
        <p style={{ color: "#a8b4e8", fontWeight: 500 }}>
          DOMINANT{" "}<span style={{ color: "#d88adb" }}>Agent {(dominantIdx ?? 0) + 1}</span>
          {"   "}
          SILENT{" "}<span style={{ color: "rgba(255,255,255,0.35)" }}>Agent {(silentIdx ?? 7) + 1}</span>
        </p>
      </div>

      <div style={{
        position: "absolute", bottom: 48, left: 48,
        fontFamily: "'Inter', monospace", fontSize: 10,
        color: "rgba(255,255,255,0.25)", pointerEvents: "none",
        lineHeight: 2, maxWidth: 420, letterSpacing: 0.5,
      }}>
        <span style={{ color: "rgba(60,220,160,0.6)" }}>●</span>{" "}Click near a silent agent to amplify their voice<br />
        <span style={{ opacity: 0.5 }}>Beam width = talk-time share · Waves = active speaking</span>
      </div>
    </div>
  );
}
