"use client";

import { useEffect, useRef, useState } from 'react';

export default function DissentExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intervention, setIntervention] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Nodes
    const nodes: { x: number; y: number; isMinority: boolean; size: number; baseColor: string; vx: number; vy: number }[] = [];
    const totalNodes = 100;
    
    for (let i = 0; i < totalNodes; i++) {
      const isMinority = i < 5; // 5 minority nodes
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        isMinority,
        size: isMinority ? 6 : Math.random() * 2 + 2,
        baseColor: isMinority ? '#ff4040' : '#444455',
        vx: (Math.random() - 0.5),
        vy: (Math.random() - 0.5)
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.4)';
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
           const dx = nodes[i].x - nodes[j].x;
           const dy = nodes[i].y - nodes[j].y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              
              if (intervention && (nodes[i].isMinority || nodes[j].isMinority)) {
                  ctx.strokeStyle = `rgba(255, 64, 64, ${0.5 - dist/200})`;
              } else {
                  ctx.strokeStyle = `rgba(100, 100, 120, ${0.1 - dist/1000})`;
              }
              ctx.stroke();
           }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw protective halo if intervention is active and it's a minority
        if (intervention && p.isMinority) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 64, 64, 0.1)';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 64, 64, 0.5)';
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // If no intervention, majority occasionally flashes minority color to absorb it visually
        if (!intervention && p.isMinority) {
            ctx.fillStyle = (Math.random() > 0.95) ? '#888' : p.baseColor;
        } else {
            ctx.fillStyle = p.baseColor;
        }
        
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [intervention]);

  return (
    <div 
        style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#050505', height: '100vh', width: '100vw', cursor: 'pointer' }}
        onMouseDown={() => setIntervention(true)}
        onMouseUp={() => setIntervention(false)}
        onTouchStart={() => setIntervention(true)}
        onTouchEnd={() => setIntervention(false)}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#aaa', fontFamily: 'monospace', fontSize: 12, pointerEvents: 'none' }}>
        Press and hold to trigger AI Minority Intervention.<br />
        Status: {intervention ? "MEDIATION ACTIVE" : "UNPROTECTED ASSIMILATION"}
      </div>
    </div>
  );
}
