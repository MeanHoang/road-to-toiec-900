'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Nút phát âm.
 *
 * Có `src` thì phát FILE MP3 sinh sẵn (xem scripts/voice-vocab.mjs). Không có
 * thì rơi về speechSynthesis của trình duyệt.
 *
 * Vì sao ưu tiên file: speechSynthesis hỏng theo kiểu tệ nhất — engine đọc của
 * Chrome kẹt ở trạng thái "đang đọc" rồi nuốt mọi lệnh sau đó, không tiếng,
 * không sự kiện `start`, không cả `error`. Đã đo tận nơi: gọi speak() trần ba
 * dòng cũng treo y hệt, trong khi `say` của macOS vẫn chạy và loa vẫn kêu.
 * Engine nằm trong tiến trình trình duyệt nên tải lại trang cũng không cứu, và
 * app không với tới. File mp3 thì không có tầng nào để hỏng.
 *
 * Vẫn giữ đường lui, vì từ mới nhập chưa kịp sinh file thì đọc máy còn hơn câm.
 */

const LOI = {
  'not-allowed': 'Your browser blocked pronunciation. Check whether this tab is muted.',
  'language-unavailable': 'No voice is available for this language on your device.',
  'voice-unavailable': 'No voice is available for this language on your device.',
  'audio-busy': 'Your audio device is busy.',
  'synthesis-failed': 'Speech playback failed.',
  'synthesis-unavailable': 'Speech playback is unavailable.',
};

const KET = 'Speech playback is stuck. Reload the page and try again.';

/** Ưu tiên giọng cài sẵn trong máy: giọng chạy qua mạng hay treo im lặng. */
function chonGiong(lang) {
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null;
  const base = lang.split('-')[0];
  return (
    all.find((v) => v.lang === lang && v.localService) ||
    all.find((v) => v.lang === lang) ||
    all.find((v) => v.lang.startsWith(base) && v.localService) ||
    all.find((v) => v.lang.startsWith(base)) ||
    null
  );
}

export function Speak({ text, lang = 'en-US', src, label }) {
  const t = useTranslation();
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);

  const dangDoc = useRef(null); // giữ utterance khỏi bị dọn rác giữa chừng
  const dangPhat = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  /** Đường lui: để trình duyệt tự đọc. */
  const doc = useCallback(() => {
    const tts = window.speechSynthesis;
    if (!tts) {
      setError('Speech playback is unavailable and this word has no pronunciation file.');
      return;
    }

    // Huỷ trước, đọc ở nhịp sau. Gọi liền tay là lệnh huỷ quét luôn câu vừa
    // xếp vào hàng và bắn ra error "canceled" — bấm nút không kêu gì cả.
    tts.cancel();
    tts.resume();

    timers.current.push(
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 0.9;
        const giong = chonGiong(lang);
        if (giong) u.voice = giong;

        let batDau = false;
        u.onstart = () => {
          batDau = true;
        };
        u.onerror = (ev) => {
          if (ev.error === 'interrupted' || ev.error === 'canceled') return;
          setError(LOI[ev.error] || `Unable to pronounce (${ev.error}).`);
        };

        dangDoc.current = u;
        tts.speak(u);

        // Chó canh: engine kẹt thì không bắn sự kiện nào cả, kể cả error.
        timers.current.push(
          setTimeout(() => {
            if (!batDau) setError(KET);
          }, 1500),
        );
      }, 120),
    );
  }, [text, lang]);

  const phat = useCallback(
    (e) => {
      e.stopPropagation();
      setError(null);
      timers.current.forEach(clearTimeout);
      timers.current = [];

      if (!src) {
        if (supported) doc();
        return;
      }

      dangPhat.current?.pause();
      const audio = new Audio(src);
      dangPhat.current = audio;
      // File thiếu hoặc hỏng thì lùi về đọc máy, đừng bắt người học chịu câm.
      audio.play().catch(() => doc());
    },
    [src, supported, doc],
  );

  if (!src && !supported) return null;

  const tenGoi = label || t('Pronounce "{0}"', [text]);
  return (
    <button
      className={`icon-btn ${error ? 'is-error' : ''}`}
      onClick={phat}
      type="button"
      aria-label={error ? `${tenGoi} — ${t(error)}` : tenGoi}
      title={error ? t(error) : tenGoi}
    >
      {error ? '⚠️' : '🔊'}
    </button>
  );
}
