// Fisher-Yates. Trả về mảng MỚI, không sửa mảng gốc — bộ từ vựng của buổi học
// được dùng lại ở nhiều chỗ, trộn tại chỗ là hỏng luôn những chỗ kia.

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Trộn rồi lấy n phần tử đầu — dùng để bốc đáp án nhiễu. */
export const pick = (arr, n) => shuffle(arr).slice(0, n);
