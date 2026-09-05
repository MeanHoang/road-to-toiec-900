// Luật của bài nghe: câu nào mở, bộ nào xong. Tách khỏi màn hình vì màn danh
// sách và màn làm bài đều cần, và vì đây là chỗ dễ sai nhất khi thêm dạng bài.

export const CHOICES = ['A', 'B', 'C', 'D'];

/** Số câu đã trả lời đúng trong một bộ. */
export const countCorrect = (set, listen) =>
  set.questions.filter((q) => listen[q.id]?.correct).length;

/**
 * Câu này có đang bị khoá không.
 *
 * CHỈ khoá khi bộ bài có đáp án chính thức: bộ không có key thì không chấm được,
 * khoá lại là chặn người học vì một chuyện không ai kiểm chứng nổi.
 */
export const isLocked = (set, idx, listen) =>
  set.mode === 'choice' && set.hasKey && idx > 0 && !listen[set.questions[idx - 1].id]?.correct;

/** Sai đủ nhiều thì cho bỏ qua — tránh kẹt cứng ở một câu. */
export const SKIP_AFTER_TRIES = 3;
