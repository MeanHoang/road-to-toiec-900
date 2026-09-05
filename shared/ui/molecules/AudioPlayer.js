'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Player gọn: play/pause, tua, đổi tốc độ. Nghe TOEIC ở 0.75× rất có ích.
 * State ở đây chỉ là state UI (đang phát, tốc độ, vị trí) — không biết gì về bài học.
 */
export function AudioPlayer({ src, onEnded }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [pos, setPos] = useState(0);

  // Đổi bài thì dừng bài cũ, kéo thanh tua về đầu.
  useEffect(() => {
    setPlaying(false);
    setPos(0);
  }, [src]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.playbackRate = rate;
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const cycleRate = () => {
    const next = rate === 1 ? 0.75 : rate === 0.75 ? 1.25 : 1;
    setRate(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const seek = (e) => {
    const el = ref.current;
    if (!el || !el.duration) return;
    const box = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - box.left) / box.width) * el.duration;
  };

  return (
    <div className="track">
      <button
        className="play"
        onClick={toggle}
        type="button"
        aria-label={playing ? 'Tạm dừng' : 'Phát'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <span className="seek" onClick={seek}>
        <i style={{ right: `${100 - pos}%` }} />
      </span>
      <button className="btn btn-quiet btn-sm" onClick={cycleRate} type="button">
        {rate}×
      </button>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setPos((el.currentTime / el.duration) * 100);
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />
    </div>
  );
}
