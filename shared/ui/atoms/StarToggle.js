/**
 * Công tắc gắn sao. Vẫn mang class `icon-btn` là có chủ đích — thẻ từ vựng lật
 * khi bấm vào mặt thẻ, và nó bỏ qua mọi thứ nằm trong `.icon-btn`, nên bấm sao
 * không làm lật thẻ.
 */
export function StarToggle({ on, label, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-btn star-toggle ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={Boolean(on)}
      aria-label={label}
      title={label}
      {...props}
    >
      {on ? '★' : '☆'}
    </button>
  );
}
