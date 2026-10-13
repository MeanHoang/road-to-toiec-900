// Luật của bài nghe: câu nào mở, bộ nào xong. Tách khỏi màn hình vì màn danh
// sách và màn làm bài đều cần, và vì đây là chỗ dễ sai nhất khi thêm dạng bài.

export const CHOICES = ['A', 'B', 'C', 'D'];

/**
 * Các phương án của một bộ. Part 1 và Part 3 có bốn (A–D), Part 2 chỉ có ba
 * (A–C) — bày ô D ra ở Part 2 là bày một phương án không tồn tại.
 */
export const choicesOf = (set) => set?.choices || CHOICES;

/**
 * Bộ này có tranh đề bài không. Chỉ Part 1 là tả tranh; Part 2 hỏi-đáp và
 * Part 3 hội thoại không có tranh, nên không được hiện ô "chưa có ảnh".
 * Bộ cũ không khai `part` đều là Part 1.
 */
export const hasPhoto = (set) => (set?.part || 1) === 1;

/** Số câu đã trả lời đúng trong một bộ. */
export const countCorrect = (set, listen) =>
  set.questions.filter((q) => listen[q.id]?.correct).length;

/** Sai đủ nhiều thì cho bỏ qua — tránh kẹt cứng ở một câu. */
export const SKIP_AFTER_TRIES = 3;
