'use client';

import { Select } from '@/shared/ui/atoms/Select';
import { useTranslation } from '@/features/language/LanguageProvider';
import { useCallback, useEffect, useRef, useState } from 'react';

// Nghe TOEIC ở 0.75× rất có ích, và câu nào nghe mãi không ra thì bò xuống 0.5×
// hoặc 0.25× để tách từng âm. Nhanh hơn 1× là để nghe lại bài đã thuộc.
const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Phím mũi tên nhảy 2 giây, Page/Home/End cho bước lớn. 2 giây là cỡ một cụm
// từ — đủ để lùi lại nghe lại chỗ vừa hụt mà không văng ra khỏi câu.
const BUOC = 2;
const BUOC_LON = 10;

const phut = (s) => {
  if (!Number.isFinite(s)) return '–:––';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * Player gọn: play/pause, KÉO để tua, hiện thời gian, chọn tốc độ.
 * Không biết gì về bài học.
 *
 * Kéo được chứ không chỉ bấm một phát: việc chính ở màn chép chính tả là tua
 * lại đúng một đoạn rồi nghe đi nghe lại. Bấm một phát thì mỗi lần lại phải
 * ngắm trúng điểm, kéo thì rà được.
 *
 * Và hiện thời gian, vì không có nó thì "chỗ lúc nãy" là một khái niệm mơ hồ —
 * người học không có cách nào nói với chính mình là cần quay lại chỗ nào.
 */
export function AudioPlayer({ src, onEnded }) {
  const t = useTranslation();
  const ref = useRef(null);
  const seekRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(NaN);
  const [keo, setKeo] = useState(false);

  // Đổi bài thì dừng bài cũ, kéo thanh tua về đầu. Giữ nguyên tốc độ đang chọn:
  // đang nghe chậm để dò từng câu thì câu sau cũng muốn chậm như thế.
  useEffect(() => {
    setPlaying(false);
    setCur(0);
    setDur(NaN);
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

  /** Nhảy tới một mốc thời gian, kẹp trong [0, dur]. */
  const toi = useCallback(
    (giay) => {
      const el = ref.current;
      if (!el || !Number.isFinite(el.duration)) return;
      const t = Math.max(0, Math.min(giay, el.duration));
      el.currentTime = t;
      setCur(t);
    },
    [],
  );

  /**
   * Đổi toạ độ chuột thành mốc thời gian.
   *
   * Đo theo RÃNH chứ không theo cả vùng bắt chuột: vùng bắt thụt vào hai bên
   * đúng bán kính núm để núm không tràn ra ngoài, nên hai mép rộng hơn rãnh.
   * Đo nhầm cái ngoài thì kéo sát mép bị lệch.
   */
  const tuToaDo = useCallback((clientX) => {
    const el = ref.current;
    const box = seekRef.current?.getBoundingClientRect();
    if (!el || !box || !box.width || !Number.isFinite(el.duration)) return null;
    const tiLe = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
    return tiLe * el.duration;
  }, []);

  // Kéo bằng Pointer Events chứ không phải mouse: một đường lo cả chuột lẫn
  // ngón tay. setPointerCapture để kéo ra ngoài thanh vẫn không tuột.
  const onPointerDown = (e) => {
    const t = tuToaDo(e.clientX);
    if (t === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setKeo(true);
    toi(t);
  };

  const onPointerMove = (e) => {
    if (!keo) return;
    const t = tuToaDo(e.clientX);
    if (t !== null) toi(t);
  };

  const ketThucKeo = (e) => {
    if (!keo) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setKeo(false);
  };

  const onKeyDown = (e) => {
    const el = ref.current;
    if (!el || !Number.isFinite(el.duration)) return;
    const map = {
      ArrowLeft: -BUOC,
      ArrowRight: BUOC,
      ArrowDown: -BUOC,
      ArrowUp: BUOC,
      PageDown: -BUOC_LON,
      PageUp: BUOC_LON,
    };
    if (e.key in map) {
      e.preventDefault();
      toi(el.currentTime + map[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      toi(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      toi(el.duration);
    }
  };

  const pct = Number.isFinite(dur) && dur > 0 ? (cur / dur) * 100 : 0;

  return (
    <div className="track">
      <button
        className="play"
        onClick={toggle}
        type="button"
        aria-label={playing ? t('Pause') : t('Play')}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <div className="track-main">
        {/* role="slider" + tabIndex: bản cũ là một <span> có onClick, bàn phím
            không tới được và trình đọc màn hình không biết nó là cái gì. */}
        <div
          className={`seek ${keo ? 'is-dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-label={t('Playback position')}
          aria-valuemin={0}
          aria-valuemax={Number.isFinite(dur) ? Math.round(dur) : 0}
          aria-valuenow={Math.round(cur)}
          aria-valuetext={t('{0} of {1}', [phut(cur), phut(dur)])}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={ketThucKeo}
          onPointerCancel={ketThucKeo}
          onKeyDown={onKeyDown}
        >
          {/* Rãnh thụt vào hai bên đúng bán kính núm, để núm ở mốc 0 và mốc
              cuối vẫn nằm trọn trong thanh. Bản trước đặt núm ngay mép rồi kéo
              lùi bằng margin âm, nên ở 0:00 nửa cái núm thò ra ngoài và đâm
              vào nút phát. */}
          <span className="seek-rail" ref={seekRef}>
            <i className="seek-fill" style={{ width: `${pct}%` }} />
            <i className="seek-thumb" style={{ left: `${pct}%` }} />
          </span>
        </div>

        <div className="track-time">
          <span className="track-now">{phut(cur)}</span>
          <span>{phut(dur)}</span>
        </div>
      </div>

      <Select
        className="rate-select"
        value={rate}
        onChange={(e) => changeRate(Number(e.target.value))}
        aria-label={t('Playback speed')}
        title={t('Playback speed')}
      >
        {RATES.map((r) => (
          <option key={r} value={r}>
            {r}×
          </option>
        ))}
      </Select>

      {/* preload="metadata" chứ không phải "none": cần biết bài dài bao nhiêu
          để hiện thời gian và để kéo được TRƯỚC khi bấm phát. Chỉ tải phần đầu
          file, không kéo cả bài về. */}
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          // Đang kéo thì bỏ qua: không thì con trỏ giật về chỗ audio đang phát.
          if (!keo) setCur(e.currentTarget.currentTime);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />
    </div>
  );
}
