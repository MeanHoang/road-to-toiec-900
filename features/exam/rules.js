// Luật của phòng thi. Không React, không fetch — có test riêng:
//   npm run test:exam
//
// Một đề trong phòng thi là MỘT đề TOEIC Listening & Reading trọn vẹn: 200 câu,
// 7 Part, lấy nguyên từ một bộ đề (content/exam/<form>.json). Không rút câu từ
// bài tập các buổi, không ghép câu của hai đề — nên hai đề không bao giờ trùng
// câu nào.

/**
 * Cấu trúc đề thật. Tên Part theo cách gọi quen của người học TOEIC ở Việt Nam.
 *   Listening: 100 câu, 45 phút — Part 1-4
 *   Reading:   100 câu, 75 phút — Part 5-7
 */
export const PARTS = [
  { part: 1, section: 'listening', label: 'Mô tả tranh', questions: 6 },
  { part: 2, section: 'listening', label: 'Hỏi & Đáp', questions: 25 },
  { part: 3, section: 'listening', label: 'Hội thoại ngắn', questions: 39 },
  { part: 4, section: 'listening', label: 'Bài nói ngắn', questions: 30 },
  { part: 5, section: 'reading', label: 'Điền vào chỗ trống', questions: 30 },
  { part: 6, section: 'reading', label: 'Điền vào đoạn văn', questions: 16 },
  { part: 7, section: 'reading', label: 'Đọc hiểu văn bản', questions: 54 },
];

export const SECTIONS = [
  { kind: 'listening', label: 'Listening' },
  { kind: 'reading', label: 'Reading' },
];

export const partSpec = (part) => PARTS.find((p) => p.part === part) || null;

/** "Part 3 — Hội thoại ngắn" */
export const partTitle = (part) => `Part ${part} — ${partSpec(part)?.label ?? ''}`;

/**
 * Giờ phần Reading theo nhịp đề thật: 75 phút cho 100 câu, tức 45 giây một
 * câu. Thi riêng một Part Đọc thì giữ đúng tỉ lệ đó.
 *
 * Phần Listening KHÔNG có hằng số giờ: nó dài đúng bằng băng (tổng độ dài các
 * file audio, đo lúc sinh audio), giống phòng thi thật — hết băng là hết giờ.
 */
export const READING_SECONDS_PER_QUESTION = 45;

/** Một đề có dùng được không: đủ câu, câu nào cũng có đáp án. */
export function isCompleteForm(form) {
  const questions = (form?.sets || []).flatMap((s) => s.questions || []);
  return questions.length > 0 && questions.every((q) => q.answer);
}
