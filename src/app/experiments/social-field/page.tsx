"use client";

import { useEffect, useRef, useState } from "react";

// Social Field Theory v2.1: Human Connective Tissue & AI Mass
// In Lewin's Field Theory, individuals exist in a web of social forces.
// This version replaces the abstract grid with actual "Human Nodes"
// connected by elastic "Social Ties".
// When an AI Agent (Mass) drops, it exerts a slow, powerful gravitational pull.
// The AI arrival has a dramatic visual "injection" effect.

interface HumanNode {
  ox: number; oy: number; // Home anchor (equilibrium)
  x: number; y: number;   // Current pos
  vx: number; vy: number; // Velocity
}

interface SocialTie {
  a: HumanNode;
  b: HumanNode;
  restLength: number;
}

interface AIMass {
  id: number;
  x: number; y: number;
  mass: number; 
  life: number;
  birthTime: number; // For drop-in animation
}

const SPACING = 45;
const SPRING_K = 0.02;      // Calmer stiffness
const ANCHOR_K = 0.0015;    // Slower pull to equilibrium
const DAMPING = 0.90;       // Smooth, fluid drag
const GRAVITY_STRENGTH = 12000; // Strong but slow accumulation

export default function SocialFieldExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiMasses, setAiMasses] = useState<AIMass[]>([]);
  const massesRef = useRef<AIMass[]>([]);
  const idCounter = useRef(0);

  useEffect(() => { massesRef.current = aiMasses; }, [aiMasses]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const nodes: HumanNode[] = [];
    const ties: SocialTie[] = [];
    
    // Create Grid of Humans
    const cols = Math.floor(W / SPACING) + 2;
    const rows = Math.floor(H / SPACING) + 2;
    
    const offsetX = (W - (cols * SPACING)) / 2;
    const offsetY = (H - (rows * SPACING)) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          ox: offsetX + c * SPACING,
          oy: offsetY + r * SPACING,
          x: offsetX + c * SPACING,
          y: offsetY + r * SPACING,
          vx: 0, vy: 0
        });
      }
    }

    // Connect them (Horizontal and Vertical ties)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (c < cols - 1) ties.push({ a: nodes[i], b: nodes[i + 1], restLength: SPACING });
        if (r < rows - 1) ties.push({ a: nodes[i], b: nodes[i + cols], restLength: SPACING });
      }
    }

    let raf: number;
    let globalTime = 0;

    const tick = () => {
      globalTime++;
      // Atmospheric background - slightly more opaque to leave softer trails
      ctx.fillStyle = "rgba(5, 5, 5, 0.6)"; 
      ctx.fillRect(0, 0, W, H);
      
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0, 20, 35, 0.2)");
      g.addColorStop(1, "rgba(0, 0, 0, 0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const masses = massesRef.current;

      // 1. Calculate Forces on Humans
      for (const n of nodes) {
        let fx = (n.ox - n.x) * ANCHOR_K;
        let fy = (n.oy - n.y) * ANCHOR_K;

        // Gravity pull from AI Masses
        for (const m of masses) {
          // Delay gravity until 'drop in' animation finishes (approx 30 frames)
          const age = globalTime - m.birthTime;
          if (age < 20) continue; 
          
          // Ramp up gravity smoothly
          const activeMass = m.mass * Math.min(1, (age - 20) / 60);

          const dx = m.x - n.x;
          const dy = m.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 200) {
            const pull = (GRAVITY_STRENGTH * activeMass) / distSq;
            fx += (dx / Math.sqrt(distSq)) * pull;
            fy += (dy / Math.sqrt(distSq)) * pull;
          }
        }
        
        n.vx += fx; n.vy += fy;
      }

      // 2. Spring Forces (Social Ties)
      for (const tie of ties) {
        const dx = tie.b.x - tie.a.x;
        const dy = tie.b.y - tie.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const force = (dist - tie.restLength) * SPRING_K;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        tie.a.vx += fx; tie.a.vy += fy;
        tie.b.vx -= fx; tie.b.vy -= fy;
      }

      // 3. Update Positions & Draw Ties
      for (const n of nodes) {
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;
      }

      for (const tie of ties) {
        const dx = tie.b.x - tie.a.x;
        const dy = tie.b.y - tie.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stretch = Math.max(0, dist - tie.restLength);
        
        // Heat threshold adjusted for new physics
        const heat = Math.min(1.0, stretch / 25);

        ctx.beginPath();
        ctx.moveTo(tie.a.x, tie.a.y);
        ctx.lineTo(tie.b.x, tie.b.y);
        
        const hue = 200 - (heat * 190); 
        ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + (heat*30)}%, ${0.15 + (heat*0.5)})`;
        ctx.lineWidth = 0.5 + (heat * 1.5);
        ctx.stroke();
      }

      // 4. Render Human Nodes
      ctx.fillStyle = "rgba(100, 200, 255, 0.4)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Render AI Masses (Gravity Cores)
      for (const m of masses) {
        // Initialize birth time if 0
        if (m.birthTime === 0) m.birthTime = globalTime;

        const age = globalTime - m.birthTime;
        
        // --- Intro "Infiltration" Animation ---
        if (age < 40) {
          const t = age / 40; // 0 to 1
          
          // Expanding Shockwave scan
          ctx.strokeStyle = `rgba(255, 140, 0, ${1 - t})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(m.x, m.y, t * 150, 0, Math.PI * 2);
          ctx.stroke();

          // Booting up text
          ctx.font = "10px monospace";
          ctx.fillStyle = `rgba(255, 140, 0, ${1 - t})`;
          const text = `INJECTING AI NODE [${m.id}]...`;
          ctx.fillText(text, m.x + 15, m.y - 15);
        }

        // --- Persistent Core Render ---
        const activeScale = Math.min(1, age / 60);
        const rad = 65 * m.mass * activeScale;
        
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rad);
        glow.addColorStop(0, `rgba(255, 140, 0, ${0.4 * activeScale})`);
        glow.addColorStop(0.3, `rgba(255, 60, 0, ${0.1 * activeScale})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, rad, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Solid Core
        const corePulse = 3.5 + Math.sin(globalTime * 0.1) * 1.5;
        ctx.fillStyle = `rgba(255, 200, 150, ${activeScale})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, corePulse * m.mass, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating tech ring
        if (activeScale > 0.1) {
          ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 * activeScale})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.setLineDash([4, 6]);
          ctx.arc(m.x, m.y, 15, globalTime * 0.05, globalTime * 0.05 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]); // reset
        }

        // Decay AI over time (very slowly)
        m.life -= 0.0015;
        m.mass = Math.max(0, m.life);
      }

      if (masses.some(m => m.life <= 0)) {
        setAiMasses(prev => prev.filter(m => m.life > 0));
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    idCounter.current += 1;
    setAiMasses(prev => [...prev, { 
      id: idCounter.current,
      x: e.clientX, 
      y: e.clientY, 
      mass: 1.0, 
      life: 1.0,
      birthTime: 0 // Will be set to globalTime effectively on next render gap, but let's approximate
    }]);
  };

  return (
    <div 
      style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"crosshair", userSelect:"none" }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} style={{ display:"block" }} />
      
      <div style={{ position:"absolute", top:40, left:48, fontFamily:"monospace", color:"#fff", pointerEvents:"none", fontSize:12, letterSpacing:2 }}>
        <p style={{opacity:0.5, marginBottom:6}}>EXPERIMENT / 04</p>
        <p style={{fontWeight: 600, color: "#ff8c00"}}>
          {">> CLICK TO INJECT AI AGENT"}
        </p>
      </div>
      
      <div style={{ position:"absolute", bottom:48, left:48, fontSize:12, color:"rgba(255,255,255,0.4)", pointerEvents:"none", lineHeight: 1.6, maxWidth: 360 }}>
        Observing how AI distorts the social fabric. <br/>
        Human ties stretch and heat up (Orange/Red) as they resist gravitational displacement.
      </div>
    </div>
  );
}
