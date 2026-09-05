/** Đầu trang của màn con: nhãn nhỏ + tiêu đề + phụ đề. */
export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </header>
  );
}
