export function Callout({ tone = 'info', className = '', ...props }) {
  return (
    <div className={`callout ${tone === 'warn' ? 'callout-warn' : ''} ${className}`} {...props} />
  );
}
