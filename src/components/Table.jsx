export default function Table({
  columns, data, onRowClick, emptyText = '暂无数据',
  selectable, selected = [], onSelect, onSelectAll,
}) {
  const allSelected = data.length > 0 && data.every((row) => selected.includes(row.id))
  const someSelected = data.some((row) => selected.includes(row.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {/* Checkbox column */}
              {selectable && (
                <th className="px-5 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase bg-gray-50/50"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={(selectable ? 1 : 0) + columns.length} className="px-5 py-12 text-center">
                  <svg className="w-5 h-5 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-sm text-gray-400">{emptyText}</span>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={
                    'transition-colors ' +
                    (onRowClick
                      ? 'cursor-pointer hover:bg-indigo-50/50'
                      : 'hover:bg-gray-50/80')
                  }
                >
                  {/* Checkbox */}
                  {selectable && (
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={(e) => onSelect?.(row, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-[15px] text-gray-700">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
