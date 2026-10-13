// Các hoạt động trong một buổi học, và thứ tự nên làm.
//
// MỘT nguồn duy nhất: màn tổng quan và drawer bên trái đều đọc từ đây, nên
// thêm hoạt động mới cho buổi sau chỉ phải sửa đúng file này.
//
// `needs` là tên collection (hoặc mảng tên, có MỘT là đủ) phải có trong buổi
// thì hoạt động mới xuất hiện —
// buổi nào không có bài dịch thì không hiện mục Bài tập ngữ pháp.

const ACTIVITIES = [
  { key: 'theory', path: 'theory', label: 'Lý thuyết', needs: ['grammar', 'theory'] },
  { key: 'cards', path: 'cards', label: 'Thẻ từ vựng', needs: 'vocabulary' },
  { key: 'game', path: 'game', label: 'Game từ vựng', needs: 'vocabulary' },
  { key: 'pictures', path: 'pictures', label: 'Từ vựng qua hình', needs: 'pictures' },
  { key: 'grammar', path: 'grammar', label: 'Bài tập ngữ pháp', needs: 'translation' },
  { key: 'exercises', path: 'exercises', label: 'Trắc nghiệm ngữ pháp', needs: 'exercises' },
  { key: 'listen', path: 'listen', label: 'Luyện nghe', needs: 'listening' },
  { key: 'vocab', path: 'vocab', label: 'Bảng từ vựng', needs: 'vocabulary' },
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

