'use client';

// PRIMITIVE — khối nhỏ nhất, không biết gì về TOEIC.
// Nếu một component ở đây phải import từ lib/days hay content/ thì nó đặt sai chỗ,
// nó thuộc về components/patterns.

import Link from 'next/link';

/** Nút. Mỗi màn chỉ nên có ĐÚNG MỘT variant="primary". */
export function Button({ variant = 'default', size, as, href, className = '', ...props }) {
  const cls = [
    'btn',
    variant !== 'default' && `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) return <Link className={cls} href={href} {...props} />;
  const Tag = as || 'button';
  return <Tag className={cls} type={Tag === 'button' ? 'button' : undefined} {...props} />;
}

export function IconButton({ className = '', ...props }) {
  return <button type="button" className={`icon-btn ${className}`} {...props} />;
}

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

export function Badge({ tone = 'neutral', eyebrow, className = '', ...props }) {
  const cls = [
    'badge',
    tone !== 'neutral' && `badge-${tone}`,
    eyebrow && 'badge-eyebrow',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls} {...props} />;
}

export function Card({ quiet, className = '', ...props }) {
  return <div className={`card ${quiet ? 'card-quiet' : ''} ${className}`} {...props} />;
}

export function Callout({ tone = 'info', className = '', ...props }) {
  return <div className={`callout ${tone === 'warn' ? 'callout-warn' : ''} ${className}`} {...props} />;
}

export function Notice({ className = '', ...props }) {
  return <div className={`notice ${className}`} {...props} />;
}

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
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      {label && <span>{label}</span>}
      <span className="progress-track">
        <i className="progress-fill" style={{ width: `${value}%` }} />
      </span>
      <span>{value}%</span>
    </div>
  );
}

export function Section({ title, lead, children }) {
  return (
    <section className="section">
      {title && <h2 className="section-title">{title}</h2>}
      {lead && <p className="section-lead">{lead}</p>}
      {children}
    </section>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />;
}

export function Switch({ checked, onChange, children }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="knob" />
      {children}
    </label>
  );
}
