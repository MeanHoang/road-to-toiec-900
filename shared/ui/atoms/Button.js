import Link from 'next/link';

/**
 * Nút. Mỗi màn chỉ nên có ĐÚNG MỘT variant="primary".
 * Có `href` thì render thành <Link>, còn lại là <button>.
 */
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
