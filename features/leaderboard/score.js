// Điểm để xếp hạng. Thuần hàm, không React, không mạng — có test riêng:
//   npm run test:score
//
// Điểm TUYỆT ĐỐI chứ không phải phần trăm. Phần trăm thì người học xong một
// buổi (100%) đứng trên người học hai buổi (80%) — thưởng sai thứ. Điểm tuyệt
// đối thưởng cho người làm nhiều hơn, và cộng dồn mãi được khi thêm buổi mới.
//
// Mỗi thứ làm xong là 1 điểm, không nhân hệ số: chưa có căn cứ nào để nói nghe
// đúng một câu khó gấp đôi thuộc một từ. Hệ số bịa ra chỉ làm bảng xếp hạng khó
// hiểu chứ không công bằng hơn.

/** Điểm của MỘT buổi. `day` là một doc tiến độ. */
export function scoreOfDay(day) {
  if (!day) return 0;

  const known = Object.values(day.vocab || {}).filter((s) => s === 'known').length;
  const listen = Object.values(day.listen || {}).filter((a) => a?.correct).length;
  const trans = Object.values(day.trans || {}).filter((t) => t?.done).length;

  return known + listen + trans;
}

/**
 * Tổng điểm qua mọi buổi. `all` là cả kho tiến độ: { "day-1": {...}, ... }
 *
 * Cố ý KHÔNG cần tới nội dung bài học: điểm chỉ đếm việc đã làm, không so với
 * tổng số việc. Nhờ vậy tính được ngay mà không phải chờ tải nội dung, và thêm
 * buổi mới cũng không làm điểm cũ của ai thay đổi.
 */
export function totalScore(all) {
  return Object.entries(all || {})
    .filter(([slug]) => slug.startsWith('day-'))
    .reduce((n, [, day]) => n + scoreOfDay(day), 0);
}

/** Tên hiển thị trên bảng. Không có tên thì lấy phần trước @ của email. */
export function displayNameOf({ name, email }) {
  const clean = (name || '').trim();
  if (clean) return clean;
  const local = (email || '').split('@')[0];
  return local || 'Người học ẩn danh';
}
