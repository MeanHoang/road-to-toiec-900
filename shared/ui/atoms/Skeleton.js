/**
 * Ô xám giữ chỗ trong lúc chờ dữ liệu.
 *
 * Luôn nhận kích thước từ bên gọi: skeleton chỉ có tác dụng khi nó cao đúng
 * bằng thứ sắp thế chỗ nó, không thì nội dung về là cả trang nhảy một cái.
 */
export function Skeleton({ width = '100%', height = 16, radius, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
