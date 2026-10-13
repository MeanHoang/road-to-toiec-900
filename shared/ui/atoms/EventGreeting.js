'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

// Dải chúc của sự kiện đang chạy, đặt ở đầu trang chủ.
//
// Tự quyết định có hiện hay không, thay vì bắt bên gọi kiểm tra ACTIVE_EVENT:
// trang chủ chỉ việc dựng nó ra, sự kiện nào không có lời chúc thì nó trả về
// `null`. Thêm một sự kiện có lời chúc về sau là sửa đúng shared/lib/event.js.
//
// Ghép từ HTML thuần, không dùng component nào khác — nên là atom, nằm cạnh
// Callout và Notice, chứ không phải molecule.
//
// Không biết TOEIC là gì, không đọc tiến độ, không fetch — nên nó ở `shared/`.

import { ACTIVE_EVENT, greetingOf } from '@/shared/lib/event';

export function EventGreeting() {
  const t = useTranslation();
  const greeting = greetingOf(ACTIVE_EVENT);
  if (!greeting) return null;

  return (
    <div className="event-greeting">
      <b>{t(greeting.title)}</b>
      <span>{t(greeting.body)}</span>
    </div>
  );
}
