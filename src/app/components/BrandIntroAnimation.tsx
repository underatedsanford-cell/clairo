"use client";

import { useEffect, useState } from 'react';

interface BrandIntroAnimationProps {
  onAnimationComplete: () => void;
}

const BrandIntroAnimation = ({ onAnimationComplete }: BrandIntroAnimationProps) => {
  const [phase, setPhase] = useState<'initial' | 'transition' | 'final' | 'done'>('initial');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transition'), 1500); // 0-1.5s: orbit
    const t2 = setTimeout(() => setPhase('final'), 3000); // 1.5-3s: O slides right
    const t3 = setTimeout(() => {
      setPhase('done');
      onAnimationComplete();
    }, 4000); // 3-4s: reveal Clairo
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden" style={{
      background: 'radial-gradient(1200px 600px at 20% 10%, rgba(29,78,216,0.08), transparent), radial-gradient(1000px 500px at 80% 90%, rgba(147,51,234,0.08), transparent), #0b0f17'
    }}>
      <style jsx>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(64px) rotate(0deg); filter: drop-shadow(0 0 8px rgba(59,130,246,0.25)); }
          50% { filter: drop-shadow(0 0 16px rgba(59,130,246,0.35)); }
          100% { transform: rotate(360deg) translateX(64px) rotate(-360deg); filter: drop-shadow(0 0 8px rgba(59,130,246,0.25)); }
        }
        @keyframes slideRight {
          0% { transform: translate(-50%, -50%) translateX(0) scale(1); filter: blur(0.2px); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(40vw) scale(0.92); filter: blur(0.4px); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translate(-50%, -52%) scale(0.98); letter-spacing: 0.02em; }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); letter-spacing: 0.01em; }
        }
        .letter { font-family: 'Inter', system-ui, sans-serif; color: #e6f2ff; text-shadow: 0 0 16px rgba(59,130,246,0.15); }
        .neon { background: linear-gradient(90deg,#c7d2fe,#93c5fd,#38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>

      {/* Initial orbiting C & O */}
      {phase !== 'done' && (
        <div className="relative w-[240px] h-[240px]">
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 120px rgba(59,130,246,0.06)' }}></div>
          <span className={`letter absolute left-1/2 top-1/2 text-8xl md:text-9xl font-semibold`} style={{ transform: 'translate(-50%, -50%)' }}>C</span>
          <span className={`letter absolute left-1/2 top-1/2 text-8xl md:text-9xl font-semibold ${phase === 'initial' ? 'animate-[orbit_1.5s_ease-in-out_infinite]' : phase === 'transition' ? 'animate-[slideRight_1.5s_cubic-bezier(0.4,0,0.2,1)_forwards]' : ''}`}>
            O
          </span>
        </div>
      )}

      {/* Final brand reveal */}
      {phase === 'final' && (
        <span className="neon absolute left-1/2 top-1/2 text-6xl md:text-7xl font-light opacity-0" style={{ animation: 'fadeUp 1s ease forwards' }}>Clairo</span>
      )}
    </div>
  );
};

export default BrandIntroAnimation;