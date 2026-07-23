// ─────────────────────────────────────────────────────────────
// PageLayout — Envoltorio estándar de página con padding y ancho máximo.
// Úsalo para envolver el contenido de cualquier página dentro de AppShell.
// ─────────────────────────────────────────────────────────────
function PageLayout({ children }) {
  return <div className="p-6 max-w-7xl mx-auto">{children}</div>;
}

export default PageLayout;
