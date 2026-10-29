import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getQuotationById, type Quotation } from '@/services/quotationService';
import { notify } from '@/utils/notifications';
import { exportQuotationToPDF } from '@/utils/pdf';

export function useQuotationDetail() {
  const { id } = useParams<{ id: string }>();
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
    handleExportPDF,
  };
}
