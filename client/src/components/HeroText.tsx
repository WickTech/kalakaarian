import { useEffect, useRef, useState } from 'react';
import { prepareWithSegments, layoutWithLines, type PreparedTextWithSegments } from '@chenglou/pretext';

const PHRASES = ['Nano creators', 'Micro influencers', 'Macro creators', 'Celeb stars'];
const SHOW_MS = 2400;
const FADE_MS = 500;
const CANVAS_H = 68;

export function HeroText() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setReady(true);

    const dpr = window.devicePixelRatio || 1;
    const prepared: PreparedTextWithSegments[] = [];
    let fontReady = false;
    let cw = 0;
    let fontSize = 40;
    let currentFont = '';
    let rafId = 0;

    const getFont = (sz: number) => `700 ${sz}px Oswald, sans-serif`;

    const initPrepared = () => {
      prepared.length = 0;
      PHRASES.forEach(p => prepared.push(prepareWithSegments(p, currentFont)));
    };

    const resize = () => {
      cw = canvas.parentElement?.clientWidth ?? 400;
      fontSize = Math.min(40, Math.max(24, Math.floor(cw / 13)));
      canvas.width = cw * dpr;
      canvas.height = CANVAS_H * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${CANVAS_H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      currentFont = getFont(fontSize);
      if (fontReady) initPrepared();
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    document.fonts.ready.then(() => {
      fontReady = true;
      initPrepared();
    });

    const state = { idx: 0, phase: 'show' as 'show' | 'out' | 'in', t0: performance.now() };

    const draw = (now: number) => {
      const elapsed = now - state.t0;
      ctx.clearRect(0, 0, cw, CANVAS_H);

      let alpha = 1;
      let dy = 0;

      if (state.phase === 'show') {
        if (elapsed >= SHOW_MS) { state.phase = 'out'; state.t0 = now; }
      } else if (state.phase === 'out') {
        const p = Math.min(1, elapsed / FADE_MS);
        alpha = 1 - p;
        dy = -p * 14;
        if (p >= 1) { state.idx = (state.idx + 1) % PHRASES.length; state.phase = 'in'; state.t0 = now; }
      } else {
        const p = Math.min(1, elapsed / FADE_MS);
        alpha = p;
        dy = (1 - p) * 14;
        if (p >= 1) { state.phase = 'show'; state.t0 = now; }
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = currentFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const grad = ctx.createLinearGradient(0, 0, cw, 0);
      grad.addColorStop(0, '#9333ea');
      grad.addColorStop(0.5, '#c026d3');
      grad.addColorStop(1, '#db2777');
      ctx.fillStyle = grad;

      const prep = prepared[state.idx];
      if (prep) {
        const { lines } = layoutWithLines(prep, cw, CANVAS_H);
        lines.forEach((line, i) => {
          const yCenter = CANVAS_H / 2 + (i - (lines.length - 1) / 2) * CANVAS_H;
          ctx.fillText(line.text, cw / 2, yCenter + dy);
        });
      } else {
        // fonts not yet ready — plain fallback render
        ctx.fillText(PHRASES[state.idx], cw / 2, CANVAS_H / 2 + dy);
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      aria-label={`Cycling text: ${PHRASES.join(', ')}`}
      role="img"
      style={{ height: CANVAS_H }}
    >
      {!ready && (
        <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          {PHRASES[0]}
        </p>
      )}
      <canvas ref={canvasRef} className={ready ? 'block' : 'hidden'} />
    </div>
  );
}
