// Các hoạt động trong một buổi học, và thứ tự nên làm.
//
// MỘT nguồn duy nhất: màn tổng quan và drawer bên trái đều đọc từ đây, nên
// thêm hoạt động mới cho buổi sau chỉ phải sửa đúng file này.
//
// `needs` là tên collection (hoặc mảng tên, có MỘT là đủ) phải có trong buổi
// thì hoạt động mới xuất hiện —
// buổi nào không có bài dịch thì không hiện mục Bài tập ngữ pháp.

const ACTIVITIES = [
  { key: 'theory', path: 'theory', label: 'Theory', needs: ['grammar', 'theory'] },
  { key: 'cards', path: 'cards', label: 'Flashcards', needs: 'vocabulary' },
  { key: 'game', path: 'game', label: 'Vocabulary game', needs: 'vocabulary' },
  { key: 'pictures', path: 'pictures', label: 'Picture vocabulary', needs: 'pictures' },
  { key: 'grammar', path: 'grammar', label: 'Grammar exercises', needs: 'translation' },
  { key: 'exercises', path: 'exercises', label: 'Grammar quiz', needs: 'exercises' },
  { key: 'listen', path: 'listen', label: 'Listening practice', needs: 'listening' },
  { key: 'vocab', path: 'vocab', label: 'Vocabulary list', needs: 'vocabulary' },
];

/**
 * Hoạt động của một buổi. Nhận buổi đầy đủ hay bản rút gọn ở drawer đều được —
 * chỉ cần có `slug` và mảng `collections`.
 */
export function lessonActivities(day) {
  const have = day?.collections || [];
  return ACTIVITIES.filter((a) => [a.needs].flat().some((n) => have.includes(n))).map((a) => ({
    ...a,
    href: `/day/${day.slug}/${a.path}`,
  }));
}

