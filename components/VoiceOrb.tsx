"use client";

import { useEffect, useRef } from "react";
import type { AgentStatus } from "@/lib/conversation";

const SIZE = 280;
const BAR_COUNT = 31;

export function VoiceOrb({ level, status }: { level: number; status: AgentStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(level);
  const statusRef = useRef(status);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let time = 0;
    let smoothLevel = 0;

    const draw = () => {
      time += 0.045;
      const status = statusRef.current;
      const isActive = status === "listening" || status === "speaking";
      const target = isActive ? Math.max(0.08, levelRef.current) : status === "thinking" ? 0.2 : 0.04;
      smoothLevel += (target - smoothLevel) * 0.12;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const radius = 84 + smoothLevel * 8;
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius + 24);
      glow.addColorStop(0, status === "error" ? "rgba(239,68,68,.22)" : "rgba(14,165,233,.18)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = status === "error" ? "#ef4444" : "#111827";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const barWidth = 3;
      const gap = 2.5;
      const totalWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
      const startX = cx - totalWidth / 2;
      for (let i = 0; i < BAR_COUNT; i++) {
        const distance = Math.abs(i - (BAR_COUNT - 1) / 2) / (BAR_COUNT / 2);
        const envelope = Math.pow(Math.max(0, 1 - distance), 0.55);
        const wave = (Math.sin(time * 2.2 + i * 0.72) + Math.sin(time * 1.3 - i * 0.38) + 2) / 4;
        const activity = isActive ? smoothLevel : status === "thinking" ? 0.16 : 0.025;
        const height = 5 + envelope * (10 + wave * 55 * activity * 4);
        const x = startX + i * (barWidth + gap);
        ctx.fillStyle = `rgba(255,255,255,${0.48 + envelope * 0.52})`;
        ctx.beginPath();
        ctx.roundRect(x, cy - height / 2, barWidth, height, barWidth / 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Voice agent is ${status}`}
      className="drop-shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
    />
  );
}
