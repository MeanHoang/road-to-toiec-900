'use client';

import { useCallback, useEffect, useState } from 'react';

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
