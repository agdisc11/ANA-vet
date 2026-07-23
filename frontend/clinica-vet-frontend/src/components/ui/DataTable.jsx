import { isValidElement } from 'react';
import { TableSkeleton, EmptyState } from '../Loaders';

/**
 * Tabla de datos declarativa. Reemplaza el bloque thead/tbody/skeleton/
 * empty-state que cada listado reimplementaba.
 *
 * Columnas: array de objetos
 *   {
 *     header: string,
 *     cell: (row) => ReactNode,   // contenido de la celda
 *     align?: 'left'|'right'|'center',
 *     className?: string,          // clases extra de la celda (td)
 *     headerClassName?: string,
 *     stopPropagation?: boolean,   // celda de acciones: no dispara onRowClick
 *   }
 *
 * @param {object[]} columns
 * @param {object[]} data          filas YA filtradas/paginadas
 * @param {boolean} [loading]
 * @param {(row) => void} [onRowClick]
 * @param {(row) => string|number} [rowKey]  default row.id
 * @param {object|ReactNode} [empty]  props de EmptyState o un nodo propio
 * @param {number} [skeletonRows]
 */
const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

export default function DataTable({
  columns,
  data = [],
  loading = false,
  onRowClick,
  rowKey = (row) => row.id,
  rowClassName,
  empty,
  skeletonRows = 8,
}) {
  if (loading) return <TableSkeleton rows={skeletonRows} cols={columns.length} />;

  return (
    <div className="table-wrapper">
      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 ${alignClass[col.align] || 'text-left'} ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${onRowClick ? 'table-row' : 'border-t border-slate-100 dark:border-slate-800'} ${rowClassName ? rowClassName(row) : ''}`}
            >
              {columns.map((col, i) => (
                <td
                  key={i}
                  className={`table-cell ${alignClass[col.align] || ''} ${col.className || ''}`}
                  onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {isValidElement(empty) ? (
                  empty
                ) : (
                  <EmptyState
                    title={empty?.title || 'Sin registros'}
                    hint={empty?.hint}
                    icon={empty?.icon}
                    action={empty?.action}
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
