// Đọc đường dẫn hiện tại. Nhờ nó mà drawer không cần ai truyền xuống mình đang
// ở màn nào — trước đây mỗi route phải tự khai `crumbLabel`.

/** '/day/day-1/cards' -> 'day-1'. Không ở trong buổi nào thì null. */
export function daySlugOf(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'day' && parts[1] ? parts[1] : null;
}

/**
 * Màn nào cần yên tĩnh.
 *
 * Người đang gõ chính tả nghe TOEIC ở 0.5× dùng gần hết bộ nhớ làm việc — một
 * cái đèn lồng trôi qua đuôi mắt là một lần phải giành lại sự chú ý. Nhưng đọc
 * lý thuyết hay lướt bảng từ vựng thì không, nên đừng tắt hiệu ứng ở đó.
 */
const CALM = ['listen', 'game', 'pictures', 'grammar', 'cards'];

export function isCalmRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'day') return false;
  return CALM.includes(parts[2]);
}
