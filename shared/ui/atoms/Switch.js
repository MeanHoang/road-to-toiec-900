export function Switch({ checked, onChange, children }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="knob" />
      {children}
    </label>
  );
}
