// Luật của bài gạch S / V / O. Không React, không state — chỉ là luật.

export const LABELS = [
  { key: 'S', text: 'chủ ngữ', tone: 'brand' },
  { key: 'V', text: 'động từ', tone: 'success' },
  { key: 'O', text: 'tân ngữ', tone: 'accent' },
];

/** Chỉ đếm cụm THẬT SỰ là S/V/O; cụm `null` trong key là cụm phải để trống. */
export const requiredCount = (key) => key.filter(Boolean).length;

/** Đã gạch đủ số cụm cần gạch chưa — điều kiện mở bước dịch. */
export const isTagged = (marks, key) =>
  Object.values(marks).filter(Boolean).length >= requiredCount(key);

/** Gạch đúng hết hay chưa. Cụm không gán nhãn tính là `null` để so với key. */
export const isAllCorrect = (marks, key) => key.every((want, i) => (marks[i] || null) === want);

/** Cụm thứ `i` có bị gạch sai không — dùng để tô viền đỏ sau khi kiểm tra. */
export const isMarkWrong = (marks, key, i) => (marks[i] || null) !== key[i];
