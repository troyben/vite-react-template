import { flexRender, type Row } from '@tanstack/react-table';
import { TableCell, TableRow } from '@/components/ui/table';

interface DataTableRowProps<T> { row: Row<T>; onRowClick?: (item: T) => void; label?: string }
export function DataTableRow<T>({ row, onRowClick, label }: DataTableRowProps<T>) {
  return <TableRow tabIndex={onRowClick ? 0 : undefined} aria-label={label}
    className={onRowClick ? 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring' : undefined}
    onClick={onRowClick ? event => {
      if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('a,button,input,textarea,select,[role="menuitem"],[role="button"],[data-row-action]'))) return;
      onRowClick(row.original);
    } : undefined}
    onKeyDown={onRowClick ? event => {
      if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); onRowClick(row.original);
    } : undefined}>
    {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
  </TableRow>;
}
