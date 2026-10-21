'use client';

import { useEffect, useRef } from 'react';
import { advanceBubbles, createBubbles } from './blastMotion';

export function useBlastMotion(questionId, count, paused) {
  const field = useRef(null), targets = useRef([]), hovered = useRef(null), focused = useRef(null);
  const pause = useRef(paused); pause.current = paused;
  useEffect(() => {
    const element = field.current;
    if (!element || !count) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let bodies = [], width = 0, height = 0, frame, last = 0;
    hovered.current = focused.current = null;
    function draw() {
      bodies.forEach((body, i) => {
        const target = targets.current[i]; if (!target) return;
        target.style.width = `${body.size}px`; target.style.height = `${body.size}px`;
        target.style.setProperty('--bubble-font', `${body.size < 125 ? 12 : body.size < 155 ? 14 : 18}px`);
        target.style.transform = `translate3d(${body.x}px,${body.y}px,0)`;
      });
    }
    function configure() {
      width = element.clientWidth; height = element.clientHeight;
      bodies = createBubbles(width, height, count); draw(); last = 0;
    }
    function tick(now) {
      if (!document.hidden && !pause.current && last) {
        const frozen = new Set([hovered.current, focused.current].filter(value => value != null));
        advanceBubbles(bodies, width, height, (now - last) / 1000, frozen); draw();
      }
      last = now; frame = requestAnimationFrame(tick);
    }
    function motionPreference() {
      cancelAnimationFrame(frame); configure();
      if (!preference.matches) frame = requestAnimationFrame(tick);
    }
    const observer = new ResizeObserver(configure); observer.observe(element);
    motionPreference(); preference.addEventListener('change', motionPreference);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); preference.removeEventListener('change', motionPreference); };
  }, [questionId, count]);
  return { field, targets, hovered, focused };
}
