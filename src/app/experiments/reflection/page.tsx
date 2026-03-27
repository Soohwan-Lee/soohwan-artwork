"use client";

import { useEffect, useRef } from 'react';

export default function ReflectionExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ripples: { x: number; y: number; life: number; maxLife: number; color: string }[] = [];

    const handleMouseMove = (e: MouseEvent) => {
        if (Math.random() > 0.6) {
           ripples.push({
               x: e.clientX,
               y: e.clientY,
               life: 0,
               maxLife: Math.random() * 100 + 50,
               color: `hsl(${Math.random() * 60 + 200}, 70%, 50%)` // Cyan/Blue gradient
           });
        }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initial background abstract topography
    let time = 0;
    
    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      time += 0.01;

      // Draw active ripples (influence trajectories)
      for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.life++;
          const progress = r.life / r.maxLife;
          
          ctx.beginPath();
          ctx.arc(r.x, r.y, progress * 150, 0, Math.PI * 2);
          ctx.strokeStyle = r.color;
          ctx.globalAlpha = (1 - progress) * 0.2;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          if (progress >= 1) {
              ripples.splice(i, 1);
          }
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#050505', height: '100vh', width: '100vw' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#aaa', fontFamily: 'monospace', fontSize: 12, pointerEvents: 'none' }}>
        Move cursor to visualize participation trajectories and value conflict topographies.
      </div>
    </div>
  );
}
