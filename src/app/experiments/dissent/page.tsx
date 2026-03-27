"use client";

import { useEffect, useRef, useState } from "react";

// Dissenting Minority v4: Force-Directed Social Network
// A physical simulation of a network. The majority (blue/grey) 
// forms a dense, tightly cohesive cluster (highly interconnected).
// The minority (red) sits on the periphery with few ties.
// 
// INTERACTION: Holding down triggers the "AI Mediation Shield."
// This emits a powerful physical repulsive force from the minority 
// nodes, visibly shoving the majority away to protect their space.

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
  strength: number;
}

const N_NODES = 85;
const N_MINORITY = 6;
const REPULSION = 1400; // Coulomb constant
const ATTRACTION = 0.015; // Spring constant
const DAMPING = 0.65;
const CENTER_FORCE = 0.035;

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

    // Initialize Nodes
    const nodes: Node[] = Array.from({ length: N_NODES }, (_, i) => ({
      id: i,
      x: W / 2 + (Math.random() - 0.5) * 400,
      y: H / 2 + (Math.random() - 0.5) * 400,
      vx: 0, vy: 0,
      isMinority: i < N_MINORITY,
      radius: i < N_MINORITY ? 6 : 3.5,
    }));

    // Initialize Edges (Homophily: majority connects tightly to majority)
    const edges: Edge[] = [];
    for (let i = 0; i < N_NODES; i++) {
      for (let j = i + 1; j < N_NODES; j++) {
        const n1 = nodes[i], n2 = nodes[j];
        let prob = 0.05; // Base probability

        if (!n1.isMinority && !n2.isMinority) prob = 0.18; // Dense majority core
        if (n1.isMinority && n2.isMinority) prob = 0.25;   // Minority solidarity
        if (n1.isMinority !== n2.isMinority) prob = 0.015; // Weak ties across groups

        if (Math.random() < prob) {
          edges.push({ source: n1, target: n2, strength: 1.0 });
        }
      }
    }

    let raf: number;
    let time = 0;

    const tick = () => {
      time++;
      // Deep fade for a slightly liquid feel
      ctx.fillStyle = "rgba(5,5,5,0.3)";
      ctx.fillRect(0, 0, W, H);

      const isMed = medRef.current;
      const forceMultiplier = isMed ? 25 : 1; 

      // 1. Calculate Forces
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        let fx = (W / 2 - n1.x) * CENTER_FORCE; // Pull to center
        let fy = (H / 2 - n1.y) * CENTER_FORCE;

        // Repulsion (All pairs)
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq === 0) continue;
          
          let repulse = REPULSION / distSq;
          
          // >>> AI MEDIATION EFFECT <<<
          // If mediation is active, minority nodes brutally push majority nodes away
          if (isMed && n1.isMinority && !n2.isMinority && distSq < 80000) {
            repulse *= 85; // Massive shield
          } else if (isMed && !n1.isMinority && n2.isMinority && distSq < 80000) {
            repulse *= 85; // Reciprocal shield
          }

          fx += (dx / Math.sqrt(distSq)) * repulse;
          fy += (dy / Math.sqrt(distSq)) * repulse;
        }
        
        n1.vx += fx; n1.vy += fy;
      }

      // 2. Attraction (Spring along edges)
      for (const edge of edges) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Let springs snap or stretch during mediation
        const springForce = (dist - 50) * ATTRACTION; 
        
        edge.source.vx += dx / dist * springForce;
        edge.source.vy += dy / dist * springForce;
        edge.target.vx -= dx / dist * springForce;
        edge.target.vy -= dy / dist * springForce;
      }

      // 3. Update Positions & Draw Edges
      for (const n of nodes) {
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;

        // Soft boundaries
        if (n.x < 50) n.vx += 2; if (n.x > W-50) n.vx -= 2;
        if (n.y < 50) n.vy += 2; if (n.y > H-50) n.vy -= 2;
      }

      // Render Edges
      for (const edge of edges) {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        
        const isMinorityEdge = edge.source.isMinority || edge.target.isMinority;
        if (isMinorityEdge) {
          ctx.strokeStyle = isMed ? "rgba(255, 60, 60, 0.45)" : "rgba(255, 100, 100, 0.15)";
        } else {
          ctx.strokeStyle = "rgba(100, 140, 255, 0.12)";
        }
        
        ctx.lineWidth = isMinorityEdge && isMed ? 1.5 : 0.6;
        ctx.stroke();
      }

      // Render Nodes & Shields
      for (const n of nodes) {
        // Minority Shield Aura
        if (n.isMinority && isMed) {
          const pulseR = 50 + Math.sin(time / 4) * 15;
          const shield = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulseR);
          shield.addColorStop(0, "rgba(255, 40, 40, 0.4)");
          shield.addColorStop(0.6, "rgba(255, 40, 40, 0.1)");
          shield.addColorStop(1, "rgba(255, 60, 60, 0)");
          ctx.fillStyle = shield;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        
        if (n.isMinority) {
          ctx.fillStyle = isMed ? "#ff2a2a" : "#dd4444";
          ctx.shadowBlur = isMed ? 20 : 10;
          ctx.shadowColor = "#ff2a2a";
        } else {
          ctx.fillStyle = "#88aaff";
          ctx.shadowBlur = 5;
          ctx.shadowColor = "#4477ff";
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div 
      style={{ background:"#050505", width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"pointer", userSelect:"none" }}
      onPointerDown={() => setMediation(true)}
      onPointerUp={() => setMediation(false)}
      onPointerLeave={() => setMediation(false)}
    >
      <canvas ref={canvasRef} style={{ display:"block" }} />
      
      {/* UI Overlay */}
      <div style={{ position:"absolute", top:40, left:48, fontFamily:"monospace", color:"#fff", pointerEvents:"none", fontSize:12, letterSpacing:2 }}>
        <p style={{opacity:0.5, marginBottom:6}}>EXPERIMENT / 02</p>
        <p style={{fontWeight: 600, color: mediation ? "#ff3c3c" : "#88aaff", transition:"color 0.3s"}}>
          {mediation ? ">> MEDIATION ACTIVE: FORCE FIELD DEPLOYED" : ">> STATUS: UNMEDIATED ASSIMILATION PRESSURE"}
        </p>
      </div>
      
      <div style={{ position:"absolute", bottom:48, left:48, fontSize:12, color:"rgba(255,255,255,0.4)", pointerEvents:"none", lineHeight: 1.6, maxWidth: 320 }}>
        [Hold Click] to trigger an AI intervention that physically protects the minority (Red) from majority absorption (Blue).
      </div>
    </div>
  );
}
