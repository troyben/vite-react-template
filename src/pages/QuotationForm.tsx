import { QuotationItemsCard } from '@/components/quotations/QuotationItemsCard';
import { QuotationTotals } from '@/components/quotations/QuotationTotals';
import { loadCosting } from '@/services/costingService';
import { withQuotationItemIds, manualMaterialsWithoutItem } from '@/services/manualMaterialService';
import { PageHeader } from '@/components/PageHeader';
import { MaterialCostAction } from '@/components/quotations/MaterialCostAction';
import { useState, useEffect } from 'react';
import { Download, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotationById, createQuotation, updateQuotation } from '../services/quotationService';
import { getAllClients } from '../services/clientService';
import { exportQuotationToPDF } from '../utils/pdf';
import type { Client } from '../services/clientService';
import type { QuotationItem, QuotationFormData, Quotation } from '../services/quotationService';
import type { ProductData } from '@/components/product-editor/types';
import ProductEditorDialog from '@/components/ProductEditorDialog';
import ClientSelector from '@/components/ClientSelector';
import TemplatePicker from '@/components/TemplatePicker';
import QuotationPreviewModal from '@/components/QuotationPreviewModal';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';
import { createTemplate } from '@/services/templateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { notify } from '@/utils/notifications';
import { useSystemSettingsStore } from '@/stores/systemSettingsStore';
import { buildSketchDescription } from '@/utils/productDescription';
import { computeTotals } from '@/utils/quotationTotals';

const emptyItem: QuotationItem = {
  item: '',
  description: '',
  quantity: 1,
  price: 0,
  total: 0
};

const QuotationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<QuotationFormData>(() => ({
    id: isEditing ? parseInt(id) : undefined,
    clientId: -1,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    items: withQuotationItemIds([{ ...emptyItem }]),
    manualMaterials: isEditing ? undefined : [],
    itemApprovals: [],
    total_amount: 0,
    vat_percent: 0,
    transport_fee: 0,
    discount_amount: 0,
    status: 'draft',
    notes: ''
  }));

  const [loading, setLoading] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSketchDialog, setShowSketchDialog] = useState<boolean>(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [showClientSelector, setShowClientSelector] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState<boolean>(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState<number>(-1);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState<boolean>(false);
  const [saveTemplateData, setSaveTemplateData] = useState<ProductData | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isEditing) setFormData(previous => ({ ...previous, manualMaterials: undefined }));
        const clientsResponse = await getAllClients();
        if (isEditing && id) {
          const [quotationResponse, privateCosting] = await Promise.all([getQuotationById(parseInt(id)), loadCosting(id)]);
          if (quotationResponse.data.data.revision !== privateCosting.revision) throw new Error('Quotation changed while loading. Reload to try again.');
          if (quotationResponse.data.success) {
            const quotationData = quotationResponse.data.data;
            const parsedItems = typeof quotationData.items === 'string'
              ? JSON.parse(quotationData.items)
              : quotationData.items;
            const total = typeof quotationData.total_amount === 'string'
              ? parseFloat(quotationData.total_amount)
              : Number(quotationData.total_amount);
            const vatPercent = typeof quotationData.vat_percent === 'string'
              ? parseFloat(quotationData.vat_percent)
              : Number(quotationData.vat_percent ?? 0);
            const transportFee = typeof quotationData.transport_fee === 'string'
              ? parseFloat(quotationData.transport_fee)
              : Number(quotationData.transport_fee ?? 0);
            setFormData({
              id: quotationData.id,
              revision: quotationData.revision,
              clientId: quotationData.clientId,
              client_name: quotationData.client_name,
              client_email: quotationData.client_email || '',
              client_phone: quotationData.client_phone || '',
              client_address: quotationData.client_address || '',
              items: withQuotationItemIds(parsedItems),
              manualMaterials: privateCosting.snapshot?.lines.filter(line => line.source !== 'automatic') ?? [],
              itemApprovals: privateCosting.snapshot?.itemApprovals ?? [],
              total_amount: total,
              vat_percent: Number.isFinite(vatPercent) ? vatPercent : 0,
              transport_fee: Number.isFinite(transportFee) ? transportFee : 0,
              discount_amount: Number(quotationData.discount_amount) || 0,
              status: quotationData.status,
              notes: quotationData.notes || ''
            });
            const clientsData = clientsResponse.data.success ? clientsResponse.data.data.items : [];
            const client = clientsData.find((c: Client) => c.id === quotationData.clientId);
            if (client) setSelectedClient(client);
          }
        }
      } catch (err) {
        setError('Failed to load the quotation and its private material costs. Reload before saving.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const calculateTotal = (items: QuotationItem[]): number =>
    items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const toMeters = (value: number, unit: string) => {
    if (unit === 'm') return value;
    if (unit === 'cm') return value / 100;
    if (unit === 'mm') return value / 1000;
    return value;
  };

  const handleItemChange = (index: number, field: keyof QuotationItem | 'rate', value: string | number) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== index) return item;
      let updatedItem: any = { ...item, [field]: value };
      if (updatedItem.productSketch && updatedItem.rate !== undefined && updatedItem.rate !== null && updatedItem.rate !== '') {
        const { width, height, unit } = updatedItem.productSketch;
        const widthM = toMeters(Number(width), unit);
        const heightM = toMeters(Number(height), unit);
        const rate = Number(updatedItem.rate);
        if (!isNaN(widthM) && !isNaN(heightM) && !isNaN(rate)) {
          updatedItem.price = +(widthM * heightM * rate).toFixed(2);
        }
      }
      if (field === 'quantity' || field === 'price' || field === 'rate') {
        updatedItem.total = updatedItem.quantity * updatedItem.price;
      }
      return updatedItem;
    });
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...(formData.items as QuotationItem[]), ...withQuotationItemIds([{ ...emptyItem }])] });
  };

  const handleRemoveItem = (index: number) => {
    if ((formData.items as QuotationItem[]).length <= 1) return;
    const updatedItems = (formData.items as QuotationItem[]).filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems, manualMaterials: manualMaterialsWithoutItem(formData.manualMaterials, formData.items[index].id), itemApprovals: formData.itemApprovals?.filter(approval => approval.quotationItemId !== formData.items[index].id), total_amount: calculateTotal(updatedItems) });
  };

  const handleSaveSketch = (productData: ProductData) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== currentItemIndex) return item;
      const autoName = buildNameFromSketch(productData);
      const autoDescription = buildDescriptionFromSketch(productData);
      const currentName = (item.item || '').trim();
      const currentDesc = (item.description || '').trim();
      const previousAutoName = item.productSketch
        ? buildNameFromSketch(item.productSketch).trim()
        : '';
      const previousAutoDesc = item.productSketch
        ? buildDescriptionFromSketch(item.productSketch).trim()
        : '';
      const shouldAutoFillName = !currentName || currentName === previousAutoName;
      const shouldAutoFillDesc = !currentDesc || currentDesc === previousAutoDesc;
      const updatedItem: any = {
        ...item,
        productSketch: { ...productData },
        ...(shouldAutoFillName ? { item: autoName } : {}),
        ...(shouldAutoFillDesc ? { description: autoDescription } : {}),
      };
      // Auto-fill rate from system settings if empty
      if (!updatedItem.rate || updatedItem.rate === 0) {
        const { getNumberSetting } = useSystemSettingsStore.getState();
        const defaultRate = productData.type === 'door'
          ? getNumberSetting('default_door_rate')
          : getNumberSetting('default_window_rate');
        if (defaultRate && defaultRate > 0) {
          updatedItem.rate = defaultRate;
        }
      }
      // Always recalculate price from rate + new dimensions
      if (updatedItem.rate && Number(updatedItem.rate) > 0) {
        const { width, height, unit } = productData;
        const widthM = toMeters(Number(width), unit);
        const heightM = toMeters(Number(height), unit);
        const rate = Number(updatedItem.rate);
        if (!isNaN(widthM) && !isNaN(heightM)) {
          updatedItem.price = +(widthM * heightM * rate).toFixed(2);
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
      }
      return updatedItem;
    });
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
    setShowSketchDialog(false);
    setCurrentItemIndex(-1);
  };

  const handleOpenSketch = (index: number) => {
    setCurrentItemIndex(index);
    setShowSketchDialog(true);
  };

  const handleCancelSketch = () => {
    setShowSketchDialog(false);
    setCurrentItemIndex(-1);
  };

  const handleTemplateSelect = (productData: ProductData) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== templateTargetIndex) return item;
      const autoName = buildNameFromSketch(productData);
      const autoDescription = buildDescriptionFromSketch(productData);
      const currentName = (item.item || '').trim();
      const currentDesc = (item.description || '').trim();
      const previousAutoName = item.productSketch
        ? buildNameFromSketch(item.productSketch).trim()
        : '';
      const previousAutoDesc = item.productSketch
        ? buildDescriptionFromSketch(item.productSketch).trim()
        : '';
      const shouldAutoFillName = !currentName || currentName === previousAutoName;
      const shouldAutoFillDesc = !currentDesc || currentDesc === previousAutoDesc;
      const updatedItem: any = {
        ...item,
        productSketch: { ...productData },
        ...(shouldAutoFillName ? { item: autoName } : {}),
        ...(shouldAutoFillDesc ? { description: autoDescription } : {}),
      };
      // Auto-fill rate from system settings if empty
      if (!updatedItem.rate || updatedItem.rate === 0) {
        const { getNumberSetting } = useSystemSettingsStore.getState();
        const defaultRate = productData.type === 'door'
          ? getNumberSetting('default_door_rate')
          : getNumberSetting('default_window_rate');
        if (defaultRate && defaultRate > 0) {
          updatedItem.rate = defaultRate;
        }
      }
      // Always recalculate price from rate + new dimensions
      if (updatedItem.rate && Number(updatedItem.rate) > 0) {
        const { width, height, unit } = productData;
        const widthM = toMeters(Number(width), unit);
        const heightM = toMeters(Number(height), unit);
        const rate = Number(updatedItem.rate);
        if (!isNaN(widthM) && !isNaN(heightM)) {
          updatedItem.price = +(widthM * heightM * rate).toFixed(2);
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
      }
      return updatedItem;
    });
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
    setShowTemplatePicker(false);
    setTemplateTargetIndex(-1);
  };

  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateData || !templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await createTemplate({ name: templateName.trim(), sketchData: saveTemplateData });
      setShowSaveTemplateDialog(false);
      setSaveTemplateData(null);
      setTemplateName('');
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setFormData({
      ...formData,
      clientId: client.id,
      client_name: client.name,
      client_email: client.email || '',
      client_phone: client.phone || '',
      client_address: client.address || '',
    });
    setSelectedClient(client);
    setShowClientSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.manualMaterials === undefined) { setError('Reload the quotation and its material costs before saving.'); return; }
    if (!selectedClient) { setError('Please select a client first.'); return; }
    try {
      setSubmitting(true);
      const quotationData: Omit<QuotationFormData, 'id'> = {
        revision: formData.revision,
        manualMaterials: formData.manualMaterials,
        itemApprovals: formData.itemApprovals,
        clientId: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email || '',
        client_phone: selectedClient.phone || '',
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({
          id: item.id, item: item.item, description: item.description || '',
          quantity: item.quantity, price: item.price,
          total: item.quantity * item.price, rate: item.rate,
          productSketch: item.productSketch ? { ...item.productSketch } : undefined
        })),
        total_amount: calculateTotal(formData.items),
        vat_percent: Number(formData.vat_percent) || 0,
        transport_fee: Number(formData.transport_fee) || 0,
        discount_amount: Number(formData.discount_amount) || 0,
        status: formData.status, notes: formData.notes || ''
      };
      if (formData.id) await updateQuotation(formData.id, quotationData);
      else await createQuotation(quotationData);
      navigate('/quotations');
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Failed to save quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formData || !selectedClient) {
      notify.error('Please select a client before downloading PDF');
      return;
    }
    try {
      setPdfLoading(true);

      // If unsaved quotation, save first to get a real DB id
      let quotationId = formData.id;
      let createdAt = formData.created_at || new Date().toISOString();
      if (!quotationId) {
        const saveData = {
          clientId: selectedClient.id,
          client_name: selectedClient.name,
          client_email: selectedClient.email || '',
          client_phone: selectedClient.phone || undefined,
          client_address: selectedClient.address || '',
          items: formData.items.map(item => ({ ...item, total: item.quantity * item.price })),
          total_amount: calculateTotal(formData.items),
          vat_percent: Number(formData.vat_percent) || 0,
          transport_fee: Number(formData.transport_fee) || 0,
          discount_amount: Number(formData.discount_amount) || 0,
          status: formData.status as 'draft' | 'sent' | 'approved' | 'rejected' | 'paid',
          notes: formData.notes || '',
          manualMaterials: formData.manualMaterials,
          itemApprovals: formData.itemApprovals,
        };
        const response = await createQuotation(saveData);
        if (response.data?.data?.id) {
          quotationId = response.data.data.id;
          createdAt = response.data.data.createdAt || createdAt;
          setFormData(prev => ({ ...prev, id: quotationId, revision: response.data.data.revision }));
          notify.success('Quotation saved');
        }
      }

      const subtotalForPdf = calculateTotal(formData.items);
      const vatPercentForPdf = Number(formData.vat_percent) || 0;
      const transportForPdf = Number(formData.transport_fee) || 0;
      const { grandTotal: grandTotalForPdf } = computeTotals(subtotalForPdf, vatPercentForPdf, transportForPdf, Number(formData.discount_amount) || 0);
      const quotationData: Quotation = {
        id: quotationId!, revision: formData.revision ?? 1, clientId: selectedClient.id,
        client_name: selectedClient.name, client_email: selectedClient.email || '',
        client_phone: selectedClient.phone || undefined,
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({ ...item, total: item.quantity * item.price })),
        total_amount: subtotalForPdf,
        vat_percent: vatPercentForPdf,
        transport_fee: transportForPdf,
        discount_amount: Number(formData.discount_amount) || 0,
        grand_total: grandTotalForPdf,
        status: formData.status,
        notes: formData.notes || '',
        created_at: createdAt,
        updated_at: new Date().toISOString(),
        createdAt: createdAt,
        updatedAt: new Date().toISOString()
      };
      await exportQuotationToPDF(quotationData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRemoveSketch = (index: number) => {
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...emptyItem, id: item.id } : item
    );
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
  };

  const buildNameFromSketch = (data: ProductData): string => {
    const openingType = data.type === 'door'
      ? (data.doorType || 'hinged')
      : (data.windowType || 'hinged');
    const productType = data.type === 'door' ? 'Door' : 'Window';
    return `${openingType.charAt(0).toUpperCase() + openingType.slice(1)} ${productType}`;
  };

  const buildDescriptionFromSketch = buildSketchDescription;

  if (loading) return <div className="p-6">Loading quotation data...</div>;

  return (
    <div className="p-3 md:p-4 space-y-3">
      {/* Header */}
      <PageHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Quotation' : 'New Quotation'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MaterialCostAction items={formData.items} quotationId={formData.id ? String(formData.id) : undefined} clientName={formData.client_name} manualMaterials={formData.manualMaterials} onManualMaterialsChange={lines => setFormData(previous => ({ ...previous, manualMaterials: lines }))} itemApprovals={formData.itemApprovals} onItemApprovalsChange={itemApprovals => setFormData(previous => ({ ...previous, itemApprovals }))} />
          <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading || formData.manualMaterials === undefined}>
            {pdfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            {pdfLoading ? 'Generating...' : 'PDF'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/quotations')}>
            Cancel
          </Button>
          <Button type="submit" form="quotation-form" size="sm" disabled={submitting || formData.manualMaterials === undefined}>
            {submitting ? 'Saving...' : isEditing ? 'Update Quotation' : 'Save Quotation'}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <form id="quotation-form" onSubmit={handleSubmit}>
        <QuotationItemsCard items={formData.items} client={selectedClient} onSelectClient={() => setShowClientSelector(true)} editing={{
          onChange: handleItemChange, onAdd: handleAddItem, onRemove: handleRemoveItem, onSketch: handleOpenSketch,
          onRemoveSketch: handleRemoveSketch, onTemplate: index => { setTemplateTargetIndex(index); setShowTemplatePicker(true); },
          onSaveTemplate: product => { setSaveTemplateData(product); setShowSaveTemplateDialog(true); },
        }} />
        <QuotationTotals subtotal={formData.total_amount} vatPercent={Number(formData.vat_percent) || 0} transportFee={Number(formData.transport_fee) || 0} discountAmount={Number(formData.discount_amount) || 0}
          onChange={values => setFormData(previous => ({ ...previous, ...values }))} />
      </form>

      {/* Modals */}
      <QuotationPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
          <QuotationPDFPreview
            clientName={selectedClient?.name || 'Client Name'}
            clientPhone={selectedClient?.phone ?? undefined}
            clientAddress={selectedClient?.address}
            items={formData.items.map(item => ({ ...item, total: item.quantity * item.price }))}
            totalAmount={calculateTotal(formData.items)}
            vatPercent={Number(formData.vat_percent) || 0}
            transportFee={Number(formData.transport_fee) || 0} discountAmount={Number(formData.discount_amount) || 0}
            quotationId={formData.id}
            createdAt={formData.created_at}
          />
      </QuotationPreviewModal>

      {showClientSelector && (
        <ClientSelector
          onSelect={handleClientSelect}
          selectedClient={selectedClient}
          onClose={() => setShowClientSelector(false)}
        />
      )}

      <ProductEditorDialog
        open={showSketchDialog}
        onOpenChange={(open) => { if (!open) handleCancelSketch(); }}
        initialData={currentItemIndex >= 0 ? (formData.items[currentItemIndex]?.productSketch as ProductData) : undefined}
        onSave={handleSaveSketch}
      />

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => { setShowTemplatePicker(false); setTemplateTargetIndex(-1); }}
        />
      )}

      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSaveTemplateDialog(false); setSaveTemplateData(null); setTemplateName(''); }} disabled={savingTemplate}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim() || savingTemplate}>
              {savingTemplate ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationForm;
