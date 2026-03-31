export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'paid';

export { formatCurrency as formatAmount } from '@/config/currency';

export const formatStatus = (status: string | undefined): string => {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const getStatusClass = (status: string): string => {
  switch (status) {
    case 'draft': return 'status-draft';
    case 'sent': return 'status-sent';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    case 'paid': return 'status-paid';
    default: return '';
  }
};

export const STATUS_OPTIONS: { value: QuotationStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];
