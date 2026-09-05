'use client';

// Chép danh sách từ chưa thuộc ra clipboard.
//
// Cần cái này vì tiến độ học nằm ở localStorage TRÊN MÁY user — skill chạy ở
// terminal không đọc được. Muốn skill sinh câu hỏi riêng cho mấy từ đang yếu thì
// phải tự đưa danh sách sang, đây là cầu nối đó.
//
// Nằm ở features/vocabulary vì nó hiểu hình dạng của một từ vựng (id, word,
// meaningVi) — shared/ui không được biết mấy thứ đó.

import { useState } from 'react';

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
