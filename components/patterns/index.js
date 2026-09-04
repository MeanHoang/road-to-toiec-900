'use client';

// PATTERN — ghép primitive lại cho một mục đích cụ thể của app này.
// Được phép biết về khái niệm "buổi học", "câu nghe", "từ vựng".

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/primitives';

/** Thanh dính trên cùng: nút quay lại + breadcrumb. */
export function TopBar({ crumbs }) {
  const router = useRouter();
  return (
    <nav className="topbar" aria-label="Điều hướng">
      <button className="back" onClick={() => router.back()} type="button" aria-label="Quay lại">
        ←
      </button>
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="sep" aria-hidden="true">›</span>}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <b aria-current="page">{c.label}</b>}
          </span>
        ))}
      </div>
    </nav>
  );
}

/** Đầu trang của màn con: nhãn nhỏ + tiêu đề + phụ đề. */
export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </header>
  );
}

/**
 * Nút phát âm bằng speechSynthesis của trình duyệt.
 * Không cần file audio nên bấm là kêu ngay — đúng cái cần khi học từ.
 */
export function Speak({ text, lang = 'en-US', label }) {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const say = useCallback(
    (e) => {
      e.stopPropagation();
      if (!supported) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [text, lang, supported],
  );

  if (!supported) return null;
  return (
    <button
      className="icon-btn"
      onClick={say}
      type="button"
      aria-label={label || `Đọc "${text}"`}
      title={label || `Đọc "${text}"`}
    >
      🔊
    </button>
  );
}

/** Player gọn: play/pause, tua, đổi tốc độ. Nghe TOEIC ở 0.75× rất có ích. */
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
      <button className="play" onClick={toggle} type="button" aria-label={playing ? 'Tạm dừng' : 'Phát'}>
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

/**
 * Thẻ điều hướng dạng danh sách — dùng cho cả danh sách buổi học lẫn
 * danh sách hoạt động trong một buổi. `lead` là số buổi hoặc icon.
 */
export function NavCard({ href, lead, leadBrand, title, meta, trailing, percent, empty }) {
  const body = (
    <>
      <span className={`lead-slot ${leadBrand ? 'brand' : ''}`} aria-hidden="true">
        {lead}
      </span>
      <span className="body">
        <span className="title">{title}</span>
        <span className="meta">{meta}</span>
        {percent != null && <Progress percent={percent} size="sm" />}
      </span>
      {trailing ?? (href && <span className="chevron" aria-hidden="true">›</span>)}
    </>
  );

  if (empty || !href) return <div className="nav-card nav-card-empty">{body}</div>;
  return (
    <Link className="nav-card" href={href}>
      {body}
    </Link>
  );
}

/**
 * Chép danh sách từ chưa thuộc ra clipboard.
 *
 * Cần cái này vì tiến độ học nằm ở localStorage TRÊN MÁY user — skill chạy ở
 * terminal không đọc được. Muốn skill sinh câu hỏi riêng cho mấy từ đang yếu thì
 * phải tự đưa danh sách sang, đây là cầu nối đó.
 */
export function CopyUnknown({ words, daySlug }) {
  const [copied, setCopied] = useState(false);

  if (!words.length) return null;

  const copy = async () => {
    const text =
      `Sinh thêm câu hỏi cho ${daySlug}, các từ đang chưa thuộc:\n` +
      words.map((w) => `${w.id}  ${w.word} — ${w.meaningVi}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className="btn btn-quiet btn-sm" onClick={copy} type="button">
      {copied ? '✓ Đã chép' : `📋 Chép ${words.length} từ chưa thuộc`}
    </button>
  );
}

/**
 * Dãy số thứ tự câu — dùng chung cho bài nghe và bài dịch.
 * `isWrong` để câu đã làm nhưng sai KHÔNG hiện xanh giống câu đúng.
 */
export function StepList({ items, currentIndex, isDone, isWrong, onPick, labelOf }) {
  return (
    <div className="steps">
      {items.map((it, i) => {
        const wrong = isWrong?.(it);
        const state =
          i === currentIndex ? 'is-current' : wrong ? 'is-wrong' : isDone(it) ? 'is-done' : '';
        return (
          <button
            key={it.id}
            type="button"
            className={`step ${state}`}
            onClick={() => onPick(i)}
            aria-label={`Câu ${labelOf ? labelOf(it) : i + 1}${wrong ? ' — đã làm sai' : isDone(it) ? ' — đã làm đúng' : ''}`}
          >
            {labelOf ? labelOf(it) : i + 1}
          </button>
        );
      })}
    </div>
  );
}
