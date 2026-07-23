/**
 * Encabezado de página: título + subtítulo a la izquierda, acción a la derecha.
 * Reemplaza el bloque `.page-header` que cada página repetía.
 *
 * @param {string} title
 * @param {string} [subtitle]
 * @param {React.ReactNode} [action]  típicamente un botón "Nuevo …"
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
