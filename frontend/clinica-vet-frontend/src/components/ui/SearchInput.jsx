/**
 * Input de búsqueda con ícono de lupa. Controlado.
 *
 * @param {string} value
 * @param {(v: string) => void} onChange   recibe el texto directamente
 * @param {string} [placeholder]
 */
export default function SearchInput({ value, onChange, placeholder = 'Buscar…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-9"
      />
    </div>
  );
}
