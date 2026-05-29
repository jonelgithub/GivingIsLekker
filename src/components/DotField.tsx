"use client";

import React, { useEffect, useRef } from "react";

export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Grid spacing configurations
    const gap = 24; // Distance between dots in px
    const particles: Particle[] = [];
    
    // Mouse/Touch interaction state
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 120, // repulsion radius in px
    };

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      density: number;
      size: number;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.vx = 0;
        this.vy = 0;
        
        // Add random variations to each dot for organic movement
        this.density = Math.random() * 20 + 8; 
        this.size = Math.random() * 1.2 + 0.8; // dots are between 0.8px and 2.0px
        this.opacity = Math.random() * 0.16 + 0.08; // subtle transparent whites
      }

      draw(context: CanvasRenderingContext2D) {
        context.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
      }

      update() {
        // 1. Elastic Hooke's Law spring back force
        const dxBase = this.baseX - this.x;
        const dyBase = this.baseY - this.y;
        
        // Spring constant: higher values return faster
        const springK = 0.06;
        const ax = dxBase * springK;
        const ay = dyBase * springK;

        this.vx += ax;
        this.vy += ay;

        // 2. Physics Repulsion from Mouse/Touch
        if (mouse.x !== null && mouse.y !== null) {
          const dxMouse = this.x - mouse.x;
          const dyMouse = this.y - mouse.y;
          const distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

          if (distance < mouse.radius) {
            // Linear push force that increases as the pointer gets closer
            const force = (mouse.radius - distance) / mouse.radius; 
            const dirX = dxMouse / distance;
            const dirY = dyMouse / distance;

            // Pushing factor inversely scaled by individual density to vary speed
            const acceleration = (force * 120) / this.density;
            this.vx += dirX * acceleration;
            this.vy += dirY * acceleration;
          }
        }

        // 3. Friction Damping
        const friction = 0.86;
        this.vx *= friction;
        this.vy *= friction;

        // 4. Update Position
        this.x += this.vx;
        this.y += this.vy;
      }
    }

    // Grid initialization
    function init() {
      particles.length = 0;
      
      // Pad grid limits slightly past boundaries to prevent clipping on boundaries
      const padding = 20;
      const cols = Math.ceil((width + padding * 2) / gap);
      const rows = Math.ceil((height + padding * 2) / gap);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap - padding;
          const y = r * gap - padding;
          particles.push(new Particle(x, y));
        }
      }
    }

    init();

    // Window size resizing handler
    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    }

    window.addEventListener("resize", handleResize);

    // Setup Event Listeners for mouse and touch interactions
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // High performance render loop
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Clean up all hooks
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-background" />;
}
