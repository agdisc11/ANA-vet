import { useEffect, useMemo, useState } from 'react';

/**
 * Búsqueda + paginación del lado del cliente para listados.
 *
 * Centraliza la lógica que cada página reimplementaba a mano (filtro por
 * texto, cálculo de páginas, recorte de la página actual). La página solo
 * aporta los datos y qué campos son buscables.
 *
 * @param {Array} data          filas completas (p. ej. de TanStack Query)
 * @param {object} opciones
 * @param {string[]} opciones.searchKeys  campos de cada fila donde buscar
 * @param {(row, q) => boolean} opciones.searchFn  filtro custom (tiene prioridad)
 * @param {number} opciones.pageSize      filas por página (default 10)
 * @returns {{ query, setQuery, page, setPage, totalPages, filtered, pageItems }}
 */
export function useClientTable(data = [], { searchKeys = [], searchFn, pageSize = 10 } = {}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Al cambiar la búsqueda se vuelve a la primera página
  useEffect(() => { setPage(1); }, [query]);

  const keysDep = searchKeys.join('|');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    if (searchFn) return data.filter((row) => searchFn(row, q));
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, keysDep, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return { query, setQuery, page: currentPage, setPage, totalPages, filtered, pageItems };
}
