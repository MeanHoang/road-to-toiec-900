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
