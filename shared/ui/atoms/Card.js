export function Card({ quiet, className = '', ...props }) {
  return <div className={`card ${quiet ? 'card-quiet' : ''} ${className}`} {...props} />;
}
