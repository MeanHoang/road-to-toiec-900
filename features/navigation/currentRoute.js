// Đọc đường dẫn hiện tại. Nhờ nó mà drawer không cần ai truyền xuống mình đang
// ở màn nào — trước đây mỗi route phải tự khai `crumbLabel`.

/** '/day/day-1/cards' -> 'day-1'. Không ở trong buổi nào thì null. */
export function daySlugOf(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'day' && parts[1] ? parts[1] : null;
}
