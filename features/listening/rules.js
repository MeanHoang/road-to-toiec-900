// Luật của bài nghe: câu nào mở, bộ nào xong. Tách khỏi màn hình vì màn danh
// sách và màn làm bài đều cần, và vì đây là chỗ dễ sai nhất khi thêm dạng bài.

export const CHOICES = ['A', 'B', 'C', 'D'];

/** Số câu đã trả lời đúng trong một bộ. */
export const countCorrect = (set, listen) =>
  set.questions.filter((q) => listen[q.id]?.correct).length;

/** Sai đủ nhiều thì cho bỏ qua — tránh kẹt cứng ở một câu. */
export const SKIP_AFTER_TRIES = 3;
