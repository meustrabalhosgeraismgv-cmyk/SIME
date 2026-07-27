import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const DataTable = ({ 
  columns, 
  data, 
  pagination, 
  onPageChange,
  onRowClick 
}) => {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, idx) => (
              <th key={idx} className={column.align === 'right' ? 'text-right' : ''}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-navy-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Nenhum registo encontrado</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tente ajustar os filtros de pesquisa</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column, colIdx) => (
                  <td key={colIdx}>
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-navy-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando <span className="font-medium text-gray-900 dark:text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
            <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
            <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> registos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let page;
                if (pagination.pages <= 5) {
                  page = i + 1;
                } else if (pagination.page <= 3) {
                  page = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  page = pagination.pages - 4 + i;
                } else {
                  page = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === page
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
