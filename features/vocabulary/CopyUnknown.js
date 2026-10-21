'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Chép danh sách từ chưa thuộc ra clipboard.
//
// Cần cái này vì tiến độ học nằm ở localStorage TRÊN MÁY user — skill chạy ở
// terminal không đọc được. Muốn skill sinh câu hỏi riêng cho mấy từ đang yếu thì
// phải tự đưa danh sách sang, đây là cầu nối đó.
//
// Nằm ở features/vocabulary vì nó hiểu hình dạng của một từ vựng (id, word,
// meaningVi) — shared/ui không được biết mấy thứ đó.

import { Icon } from '@/shared/ui/atoms/Icon';
import { useState } from 'react';

export function CopyUnknown({ words, daySlug }) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!words.length) return null;

  const copy = async () => {
    const text =
      t('Generate more quiz questions for {0}, using these words I am still learning:', [daySlug]) + '\n' +
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
      <Icon name="list" size={16} />{copied ? t('✓ Copied') : t('Copy {0} words to learn', [words.length])}
    </button>
  );
}
