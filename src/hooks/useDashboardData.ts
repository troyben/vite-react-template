import { useState, useEffect, useMemo } from 'react';
import { getAllQuotations, type Quotation } from '@/services/quotationService';
import { getAllClients, type Client } from '@/services/clientService';

export const statusMap: Record<string, string> = {
  'draft': 'Draft',
  'sent': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'paid': 'Paid',
};

export function getStatusClass(status: string): string {
  const mappedStatus = statusMap[status as keyof typeof statusMap];
  if (!mappedStatus) return '';

  const uiStatus = mappedStatus.toLowerCase();
  switch (uiStatus) {
    case 'pending': return 'status-pending';
    case 'paid': return 'status-paid';
    case 'draft': return 'status-draft';
    case 'rejected': return 'status-rejected';
    default: return '';
  }
}

export function formatCurrency(amount: any): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return typeof num === 'number' && !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
}

function calculateAmount(quotations: Quotation[]): number {
  return quotations.reduce((sum, quotation) => {
    const amount = typeof quotation.total_amount === 'string'
      ? parseFloat(quotation.total_amount)
      : Number(quotation.total_amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
}

export interface StatusGroup {
  label: string;
  quotations: Quotation[];
  amount: number;
  cssClass: string;
}

export interface DashboardData {
  loading: boolean;
  error: string | null;
  clients: Record<number, Client>;
  totalQuotations: number;
  recentQuotations: Quotation[];
  paid: StatusGroup;
  pending: StatusGroup;
  approved: StatusGroup;
  draft: StatusGroup;
  rejected: StatusGroup;
}

export function useDashboardData(): DashboardData {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quotationsRes, clientsRes] = await Promise.all([
          getAllQuotations(),
          getAllClients(),
        ]);

        // Correctly access the nested data property
        setQuotations(quotationsRes.data.success ? quotationsRes.data.data : []);

        // Create a map of clientId to client for easy lookup
        const clientMap = (clientsRes.data.success ? clientsRes.data.data : []).reduce(
          (acc, client) => {
            acc[client.id] = client;
            return acc;
          },
          {} as Record<number, Client>,
        );

        setClients(clientMap);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const paidQuotations = quotations.filter(q => q.status === 'paid');
    const pendingQuotations = quotations.filter(q => q.status === 'sent');
    const approvedQuotations = quotations.filter(q => q.status === 'approved');
    const draftQuotations = quotations.filter(q => q.status === 'draft');
    const rejectedQuotations = quotations.filter(q => q.status === 'rejected');

    const recentQuotations = [...quotations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalQuotations: quotations.length,
      recentQuotations,
      paid: { label: 'Paid', quotations: paidQuotations, amount: calculateAmount(paidQuotations), cssClass: 'paid' },
      pending: { label: 'Pending', quotations: pendingQuotations, amount: calculateAmount(pendingQuotations), cssClass: 'pending' },
      approved: { label: 'Approved', quotations: approvedQuotations, amount: calculateAmount(approvedQuotations), cssClass: 'approved' },
      draft: { label: 'Drafts', quotations: draftQuotations, amount: calculateAmount(draftQuotations), cssClass: 'draft' },
      rejected: { label: 'Rejected', quotations: rejectedQuotations, amount: calculateAmount(rejectedQuotations), cssClass: 'rejected' },
    };
  }, [quotations]);

  return {
    loading,
    error,
    clients,
    ...stats,
  };
}
