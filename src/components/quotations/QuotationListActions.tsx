import { Eye, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface QuotationListActionHandlers { onView: (id: number) => void; onEdit: (id: number) => void; onDelete: (id: number) => void; deletingId: number | null }
interface QuotationListActionsProps extends QuotationListActionHandlers { id: number; writable: boolean }
export const QuotationListActions: React.FC<QuotationListActionsProps> = ({ id, writable, onView, onEdit, onDelete, deletingId }) => (
  <DropdownMenu><DropdownMenuTrigger aria-label={`Actions for quotation #${id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-52"><DropdownMenuGroup><DropdownMenuLabel>Quotation #{id}</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onView(id)}><Eye className="h-4 w-4" />View quotation</DropdownMenuItem>
      {writable && <DropdownMenuItem onClick={() => onEdit(id)}><Pencil className="h-4 w-4" />Edit quotation</DropdownMenuItem>}
    </DropdownMenuGroup>{writable && <><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem variant="destructive" onClick={() => onDelete(id)} disabled={deletingId === id}>
      {deletingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deletingId === id ? 'Deleting...' : 'Delete quotation'}
    </DropdownMenuItem></DropdownMenuGroup></>}</DropdownMenuContent>
  </DropdownMenu>
);
