export function Section({ title, lead, children }) {
  return (
    <section className="section">
      {title && <h2 className="section-title">{title}</h2>}
      {lead && <p className="section-lead">{lead}</p>}
      {children}
    </section>
  );
}
