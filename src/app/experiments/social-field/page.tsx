"use client";

import { useEffect, useRef, useState } from "react";

// Social Field Theory v1: Kurt Lewin's Gravity Well
// Inspired by Lewin's Field Theory (B = f(P, E)).
// The social group is a force field (mesh). Clicking drops an "AI Mass" 
// that warps local force vectors, symbolizing the profound impact 
// of AI agents on collective group spaces.
// Tech: 2D Canvas warped grid system.

interface GridPoint {
  ox: number; oy: number; // Original
  x: number; y: number;   // Current
}

interface AINode {
  x: number; y: number;
  mass: number;
  life: number;
}

const GRID_SIZE = 35; // Spacing
const MESH_SPEED = 0.08;
const GRAVITY_STRENGTH = 4500;

export default function SocialFieldExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiNodes, setAiNodes] = useState<AINode[]>([]);
  const nodesRef = useRef<AINode[]>([]);

  useEffect(() => { nodesRef.current = aiNodes; }, [aiNodes]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const points: GridPoint[] = [];
    const cols = Math.ceil(W / GRID_SIZE) + 2;
    const rows = Math.ceil(H / GRID_SIZE) + 2;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        points.push({
          ox: i * GRID_SIZE,
          oy: j * GRID_SIZE,
          x: i * GRID_SIZE,
          y: j * GRID_SIZE
        });
      }
    }

    let raf: number;
    let time = 0;

    const tick = () => {
      time++;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // Deep Space Atmosphere
      const g = ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0, "rgba(0,30,60,0.1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);

      const activeNodes = nodesRef.current;
      
      // Update Grid Dynamics
      points.forEach(p => {
        let tx = p.ox, ty = p.oy;
        
        activeNodes.forEach(n => {
          const dx = n.x - p.ox, dy = n.y - p.oy;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 400) {
            const force = (GRAVITY_STRENGTH * n.mass) / (distSq + 2000);
            tx += (dx / dist) * force * 15;
            ty += (dy / dist) * force * 15;
          }
        });

        // Smoothly interpolate to target
        p.x += (tx - p.x) * MESH_SPEED;
        p.y += (ty - p.y) * MESH_SPEED;
      });

      // Draw Grid Lines (Horizontal)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 160, 255, 0.15)";
      ctx.lineWidth = 0.8;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const p1 = points[j * cols + i];
          const p2 = points[j * cols + i + 1];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();

      // Draw Grid Lines (Vertical)
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows - 1; j++) {
          const p1 = points[j * cols + i];
          const p2 = points[(j + 1) * cols + i];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();

      // Draw Active AI Masses
      activeNodes.forEach(n => {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 40 * n.mass);
        glow.addColorStop(0, "rgba(255, 200, 0, 0.8)");
        glow.addColorStop(0.5, "rgba(255, 100, 0, 0.2)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 40 * n.mass, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3 * n.mass, 0, Math.PI * 2);
        ctx.fill();
        
        n.life -= 0.005;
        n.mass = Math.max(0, n.life);
      });

      // Cleanup dead nodes
      if (activeNodes.some(n => n.life <= 0)) {
        setAiNodes(prev => prev.filter(n => n.life > 0));
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const newNode: AINode = {
      x: e.clientX,
      y: e.clientY,
      mass: 1.0,
      life: 1.0
    };
    setAiNodes(prev => [...prev, newNode]);
  };

  return (
    <div 
      style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"crosshair" }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} style={{ display:"block" }} />
      <div style={{ position:"absolute", top:32, left:36, fontFamily:"monospace", color:"#fff", pointerEvents:"none", fontSize:11, letterSpacing:2 }}>
        <p style={{opacity:0.6}}>Status: Kurt Lewin's Social Field Mapper</p>
        <p style={{color: "#00a0ff"}}>Click to Drop AI Participant Masses</p>
      </div>
      <div style={{ position:"absolute", bottom:32, left:36, fontSize:10, color:"rgba(255,255,255,0.3)", pointerEvents:"none" }}>
        $B = f(P, E)$ — Visualizing the Life Space.
      </div>
    </div>
  );
}
