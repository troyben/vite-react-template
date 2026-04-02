import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotationById, deleteQuotation, updateQuotation, type Quotation } from '@/services/quotationService';
import { notify } from '@/utils/notifications';
import { exportQuotationToPDF } from '@/utils/pdf';
import type { QuotationStatus } from '@/utils/quotationHelpers';

export function useQuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getQuotationById(parseInt(id));
        if (response.data.success) {
          const quotationData = response.data.data;
          setQuotation({
            ...quotationData,
            items: typeof quotationData.items === 'string'
              ? JSON.parse(quotationData.items)
              : quotationData.items,
            status: quotationData.status || 'draft'
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching quotation:', err);
        setError('Failed to fetch quotation details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id || !quotation) return;

    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(parseInt(id));
        navigate('/');
      } catch (err) {
        console.error('Error deleting quotation:', err);
        setError('Failed to delete quotation. Please try again.');
      }
    }
  }, [id, quotation, navigate]);

  const handleStatusChange = useCallback(async (newStatus: QuotationStatus) => {
    if (!id || !quotation) return;

    try {
      setLoading(true);
      const response = await updateQuotation(parseInt(id), {
        ...quotation,
        status: newStatus,
        items: Array.isArray(quotation.items) ? quotation.items : JSON.parse(quotation.items)
      });

      if (response.data.success) {
        setQuotation(prev => prev ? { ...prev, status: newStatus } : null);
        notify.success(`Quotation status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      notify.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  }, [id, quotation]);

  const handleExportPDF = useCallback(async () => {
    if (!quotation) return;
    try {
      setPdfLoading(true);
      await exportQuotationToPDF(quotation);
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  }, [quotation]);

  return {
    id,
    quotation,
    loading,
    error,
    pdfLoading,
    handleDelete,
    handleStatusChange,
    handleExportPDF,
  };
}
