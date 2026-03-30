import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import '../styles/BaseDataTable.css';

interface BaseDataTableProps<T extends object> {
  columns?: ColumnDef<T, any>[];
  data: T[];
  globalFilterPlaceholder?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

function BaseDataTable<T extends object>({
  columns = [],
  data,
  globalFilterPlaceholder,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: BaseDataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="datatable-container">
      <div className="datatable-toolbar">
        <input
          className="form-control"
          style={{ maxWidth: 300 }}
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder={globalFilterPlaceholder || 'Search...'}
        />
      </div>
      <div className="datatable-table-wrapper">
        <table className="datatable-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : undefined }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span style={{ marginLeft: 4 }}>
                        {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : ''}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} style={{ textAlign: 'center', color: '#888eb0', padding: '32px 0' }}>
                  No data found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="datatable-pagination">
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            {'<'}
          </button>
          <span style={{ margin: '0 8px' }}>
            Page{' '}
            <strong>
              {currentPage} of {totalPages}
            </strong>
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            {'>'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BaseDataTable;