// Lễ hội nào đang chạy. Đổi ĐÚNG MỘT DÒNG dưới đây là đổi cả bảng màu lẫn lớp
// phủ của toàn app. `null` = tắt hẳn, mọi thứ về theme gốc.
//
// Đây là quyết định của người viết code, không phải công tắc cho người học:
// một app học TOEIC không cần bắt người dùng chọn xem có muốn xem đèn lồng hay
// không. Và vì nó là hằng số lúc build nên server với client render giống hệt
// nhau — không hydration mismatch, không chớp màu lúc tải, màu vẫn đúng kể cả
// khi JS chết.
export const ACTIVE_EVENT = 'mid-autumn';

// Màu thanh địa chỉ trên mobile phải khớp --bg, không thì nó lệch hẳn so với
// trang. `base` là giá trị gốc trong tokens.css (--slate-50 / --slate-950).
const THEME_COLOR = {
  base: { light: '#f6f8fb', dark: '#0d131d' },
  'mid-autumn': { light: '#fdf6ea', dark: '#150f1c' },
};

export function themeColorOf(eventId) {
  return THEME_COLOR[eventId] || THEME_COLOR.base;
}
