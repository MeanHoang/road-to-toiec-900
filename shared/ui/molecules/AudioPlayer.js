'use client';

import { useEffect, useRef, useState } from 'react';

// Nghe TOEIC ở 0.75× rất có ích, và câu nào nghe mãi không ra thì bò xuống 0.5×
// hoặc 0.25× để tách từng âm. Nhanh hơn 1× là để nghe lại bài đã thuộc.
const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Player gọn: play/pause, tua, chọn tốc độ. Không biết gì về bài học. */
export function AudioPlayer({ src, onEnded }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [pos, setPos] = useState(0);

  // Đổi bài thì dừng bài cũ, kéo thanh tua về đầu. Giữ nguyên tốc độ đang chọn:
  // đang nghe chậm để dò từng câu thì câu sau cũng muốn chậm như thế.
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

  const changeRate = (value) => {
    setRate(value);
    if (ref.current) ref.current.playbackRate = value;
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

      <select
        className="rate-select"
        value={rate}
        onChange={(e) => changeRate(Number(e.target.value))}
        aria-label="Tốc độ phát"
        title="Tốc độ phát"
      >
        {RATES.map((r) => (
          <option key={r} value={r}>
            {r}×
          </option>
        ))}
      </select>

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
