/** Thanh tiến độ. `label` bỏ trống thì chỉ còn thanh, dùng cho chỗ chật. */
export function Progress({ percent, label, size }) {
  const value = Math.max(0, Math.min(100, Math.round(percent || 0)));
  if (size === 'sm') {
    return (
      <span className="progress-track progress-track-sm">
        <i className="progress-fill" style={{ width: `${value}%` }} />
      </span>
    );
  }
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {label && <span>{label}</span>}
      <span className="progress-track">
        <i className="progress-fill" style={{ width: `${value}%` }} />
      </span>
      <span>{value}%</span>
    </div>
  );
}
