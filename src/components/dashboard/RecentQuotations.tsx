import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/quotations/StatusBadge';
import type { Quotation } from '@/services/quotationService';
import type { Client } from '@/services/clientService';
import { formatCurrency } from '@/hooks/useDashboardData';

interface RecentQuotationsProps {
  quotations: Quotation[];
  clients: Record<number, Client>;
}

export function RecentQuotations({ quotations, clients }: RecentQuotationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Quotations</CardTitle>
        <Link to="/quotations" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotations found.</p>
        ) : (
          <Table>
            <TableBody>
              {quotations.map(quotation => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">
                    <Link to={`/quotations/${quotation.id}`} className="hover:underline">
                      <span className="text-muted-foreground">#</span>
                      {quotation.id.toString().padStart(6, '0')}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {clients[quotation.clientId]?.name || 'Loading...'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quotation.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={quotation.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
