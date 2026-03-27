"use client";

import { useEffect, useRef, useState } from "react";

// Social Field Theory v2: Human Connective Tissue & AI Mass
// In Lewin's Field Theory, individuals exist in a web of social forces.
// This version replaces the abstract grid with actual "Human Nodes"
// connected by elastic "Social Ties".
// When an AI Agent (Mass) drops, it exerts gravitational pull on the humans.
// Their ties physically stretch and glow red-hot under the tension,
// visualizing how AI distorts the social fabric.

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
  x: number; y: number;
  mass: number; life: number;
}

const SPACING = 45;
const SPRING_K = 0.08;      // Stiffness of social ties
const ANCHOR_K = 0.005;     // Pull to equilibrium
const DAMPING = 0.82;
const GRAVITY_STRENGTH = 25000;

export default function SocialFieldExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiMasses, setAiMasses] = useState<AIMass[]>([]);
  const massesRef = useRef<AIMass[]>([]);

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
    
    // Offset to center
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

    const tick = () => {
      // Atmospheric background
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);
      
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0, 20, 40, 0.4)");
      g.addColorStop(1, "rgba(0, 0, 0, 0.8)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const masses = massesRef.current;

      // 1. Calculate Forces on Humans
      for (const n of nodes) {
        let fx = (n.ox - n.x) * ANCHOR_K;
        let fy = (n.oy - n.y) * ANCHOR_K;

        // Gravity pull from AI Masses
        for (const m of masses) {
          const dx = m.x - n.x;
          const dy = m.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 100) {
            const pull = (GRAVITY_STRENGTH * m.mass) / distSq;
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
        
        // Elastic force
        const force = (dist - tie.restLength) * SPRING_K;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        tie.a.vx += fx; tie.a.vy += fy;
        tie.b.vx -= fx; tie.b.vy -= fy;
      }

      // 3. Update Positions
      for (const n of nodes) {
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;
      }

      // 4. Render Ties (Color based on tension stretching)
      for (const tie of ties) {
        const dx = tie.b.x - tie.a.x;
        const dy = tie.b.y - tie.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stretch = Math.max(0, dist - tie.restLength);
        
        // Normalize stretch (0 = cool blue, 30+ = hot orange/red)
        const heat = Math.min(1.0, stretch / 35);

        ctx.beginPath();
        ctx.moveTo(tie.a.x, tie.a.y);
        ctx.lineTo(tie.b.x, tie.b.y);
        
        // Shift color from 200 (Blue) to 10 (Red/Orange)
        const hue = 200 - (heat * 190); 
        ctx.strokeStyle = `hsla(${hue}, 100%, ${60 + (heat*20)}%, ${0.2 + (heat*0.8)})`;
        ctx.lineWidth = 0.8 + (heat * 1.5);
        ctx.stroke();
      }

      // 5. Render Human Nodes
      ctx.fillStyle = "rgba(100, 200, 255, 0.4)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Render AI Masses (Gravity Cores)
      for (const m of masses) {
        const rad = 60 * m.mass;
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rad);
        glow.addColorStop(0, "rgba(255, 140, 0, 0.6)");
        glow.addColorStop(0.3, "rgba(255, 60, 0, 0.2)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4 * m.mass, 0, Math.PI * 2);
        ctx.fill();

        m.life -= 0.005;
        m.mass = Math.max(0, m.life);
      }

      // Cleanup dead AI masses
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
    setAiMasses(prev => [...prev, { x: e.clientX, y: e.clientY, mass: 1.0, life: 1.0 }]);
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
          {">> CLICK TO DROP AI INTERVENTION (MASS)"}
        </p>
      </div>
      
      <div style={{ position:"absolute", bottom:48, left:48, fontSize:12, color:"rgba(255,255,255,0.4)", pointerEvents:"none", lineHeight: 1.6, maxWidth: 360 }}>
        Observing how AI distorts the social fabric. <br/>
        Human ties stretch and heat up (Orange/Red) as they resist gravitational displacement.
      </div>
    </div>
  );
}
