// Chấm bài "nhìn hình điền từ". Thuần hàm — màn hình chỉ việc hỏi.

import { matchesAny } from '@/shared/lib/text';

/** Đúng nếu khớp `answer` hoặc bất kỳ cách viết nào trong `accept`. */
export const isRight = (question, value) =>
  Boolean(question.answer) && matchesAny(value, [question.answer, ...(question.accept || [])]);

/** Sai chỉ tính khi CÓ đáp án và người học ĐÃ gõ gì đó — bỏ trống không phải là sai. */
export const isWrong = (question, value) =>
  Boolean(question.answer) && Boolean(value) && !isRight(question, value);

/** Bao nhiêu ảnh trong nhóm đã được gán đáp án. Bằng 0 nghĩa là chưa chấm được. */
export const countLabelled = (set) => set.questions.filter((q) => q.answer).length;
