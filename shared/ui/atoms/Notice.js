export function Notice({ className = '', ...props }) {
  return <div className={`notice ${className}`} {...props} />;
}
