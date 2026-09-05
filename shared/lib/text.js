// So khớp chuỗi người học gõ vào. Người học gõ " Cap " thì vẫn phải tính là "cap".

/** Chuẩn hoá để so sánh: bỏ khoảng trắng thừa, về chữ thường. */
export const norm = (s) => (s || '').trim().toLowerCase();

/** `value` có khớp bất kỳ cách viết nào được chấp nhận không. */
export const matchesAny = (value, accepted) =>
  accepted.filter(Boolean).some((a) => norm(a) === norm(value));

/** Chuỗi `haystack` có chứa `needle` không, đã chuẩn hoá hai bên. */
export const includesNorm = (haystack, needle) => norm(haystack).includes(norm(needle));
