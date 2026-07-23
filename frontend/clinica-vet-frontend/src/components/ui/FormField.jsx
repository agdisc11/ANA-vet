/**
 * Campo de formulario: etiqueta + control. Encapsula el par
 * `<label className="input-label"> + control` repetido en cada formulario.
 *
 * Uso con input controlado sencillo:
 *   <FormField label="Nombre *" value={x} onChange={setX} placeholder="…" />
 *
 * O envolviendo un control propio (select, textarea, etc.):
 *   <FormField label="Especie *"><select className="input">…</select></FormField>
 *
 * @param {string} label
 * @param {string} [value]              si se pasa, renderiza un <input> interno
 * @param {(v:string)=>void} [onChange] recibe el texto directamente
 * @param {React.ReactNode} [children]  control propio (tiene prioridad)
 * @param {string} [className]          clases del contenedor (p.ej. 'sm:col-span-2')
 */
export default function FormField({
  label,
  value,
  onChange,
  children,
  className = '',
  type = 'text',
  placeholder,
  ...inputProps
}) {
  return (
    <div className={className}>
      {label && <label className="input-label">{label}</label>}
      {children ?? (
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="input"
          {...inputProps}
        />
      )}
    </div>
  );
}
