import { useState, useEffect } from 'react';
import { Plus, X, Image, Download, Phone, MapPin, Eye, ArrowLeft, LayoutTemplate, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotationById, createQuotation, updateQuotation } from '../services/quotationService';
import { getAllClients } from '../services/clientService';
import { exportQuotationToPDF } from '../utils/pdf';
import type { Client } from '../services/clientService';
import type { QuotationItem, QuotationFormData, Quotation } from '../services/quotationService';
import type { ProductData } from '@/components/product-sketch/types';
import ProductEditorDialog from '@/components/ProductEditorDialog';
import ShapeCanvas from '@/components/template-creator/ShapeCanvas';
import { extractShapeCanvasProps } from '@/utils/templateSketchProps';
import ClientSelector from '@/components/ClientSelector';
import TemplatePicker from '@/components/TemplatePicker';
import QuotationPreviewModal from '@/components/QuotationPreviewModal';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';
import { createTemplate } from '@/services/templateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/config/currency';
import { notify } from '@/utils/notifications';
import { useSystemSettingsStore } from '@/stores/systemSettingsStore';

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

  const [formData, setFormData] = useState<QuotationFormData>({
    id: isEditing ? parseInt(id) : undefined,
    clientId: -1,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    items: [{ ...emptyItem }],
    total_amount: 0,
    status: 'draft',
    notes: ''
  });

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
        const clientsResponse = await getAllClients();
        if (isEditing && id) {
          const quotationResponse = await getQuotationById(parseInt(id));
          if (quotationResponse.data.success) {
            const quotationData = quotationResponse.data.data;
            const parsedItems = typeof quotationData.items === 'string'
              ? JSON.parse(quotationData.items)
              : quotationData.items;
            const total = typeof quotationData.total_amount === 'string'
              ? parseFloat(quotationData.total_amount)
              : Number(quotationData.total_amount);
            setFormData({
              id: quotationData.id,
              clientId: quotationData.clientId,
              client_name: quotationData.client_name,
              client_email: quotationData.client_email || '',
              client_phone: quotationData.client_phone || '',
              client_address: quotationData.client_address || '',
              items: parsedItems,
              total_amount: total,
              status: quotationData.status,
              notes: quotationData.notes || ''
            });
            const clientsData = clientsResponse.data.success ? clientsResponse.data.data.items : [];
            const client = clientsData.find((c: Client) => c.id === quotationData.clientId);
            if (client) setSelectedClient(client);
          }
        }
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
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
    setFormData({ ...formData, items: [...(formData.items as QuotationItem[]), { ...emptyItem }] });
  };

  const handleRemoveItem = (index: number) => {
    if ((formData.items as QuotationItem[]).length <= 1) return;
    const updatedItems = (formData.items as QuotationItem[]).filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
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

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateData || !templateName.trim()) return;
    try {
      await createTemplate({ name: templateName.trim(), sketchData: saveTemplateData });
      setShowSaveTemplateDialog(false);
      setSaveTemplateData(null);
      setTemplateName('');
    } catch (err) {
      setError('Failed to save template. Please try again.');
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
    if (!selectedClient) { setError('Please select a client first.'); return; }
    try {
      setSubmitting(true);
      const quotationData: Omit<QuotationFormData, 'id'> = {
        clientId: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email || '',
        client_phone: selectedClient.phone || '',
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({
          item: item.item, description: item.description || '',
          quantity: item.quantity, price: item.price,
          total: item.quantity * item.price, rate: item.rate,
          productSketch: item.productSketch ? { ...item.productSketch } : undefined
        })),
        total_amount: calculateTotal(formData.items),
        status: 'draft', notes: formData.notes || ''
      };
      if (isEditing && id) await updateQuotation(parseInt(id), quotationData);
      else await createQuotation(quotationData);
      navigate('/quotations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quotation.');
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
          status: formData.status as 'draft' | 'sent' | 'approved' | 'rejected' | 'paid',
          notes: formData.notes || '',
        };
        const response = await createQuotation(saveData);
        if (response.data?.data?.id) {
          quotationId = response.data.data.id;
          createdAt = response.data.data.createdAt || createdAt;
          setFormData(prev => ({ ...prev, id: quotationId }));
          notify.success('Quotation saved');
        }
      }

      const quotationData: Quotation = {
        id: quotationId!, clientId: selectedClient.id,
        client_name: selectedClient.name, client_email: selectedClient.email || '',
        client_phone: selectedClient.phone || undefined,
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({ ...item, total: item.quantity * item.price })),
        total_amount: calculateTotal(formData.items), status: formData.status,
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
      i === index ? { ...emptyItem } : item
    );
    setFormData({ ...formData, items: updatedItems, total_amount: calculateTotal(updatedItems) });
  };

  const formatAmount = formatCurrency;

  const FRAME_COLOR_NAMES: Record<string, string> = {
    '#C0C0C0': 'Natural/Silver',
    '#4F4F4F': 'Charcoal Grey',
    '#CD7F32': 'Bronze',
  };

  const buildNameFromSketch = (data: ProductData): string => {
    const openingType = data.type === 'door'
      ? (data.doorType || 'hinged')
      : (data.windowType || 'hinged');
    const productType = data.type === 'door' ? 'Door' : 'Window';
    return `${openingType.charAt(0).toUpperCase() + openingType.slice(1)} ${productType}`;
  };

  const buildDescriptionFromSketch = (data: ProductData): string => {
    const lines: string[] = [];
    lines.push(`${data.width} x ${data.height} ${data.unit}`);
    if (data.glassType) {
      const glass = data.glassType === 'custom-tint'
        ? `Custom Tint${data.customGlassTint ? ` (${data.customGlassTint})` : ''}`
        : data.glassType.charAt(0).toUpperCase() + data.glassType.slice(1);
      lines.push(`Glass: ${glass}`);
    }
    if (data.frameColor) {
      lines.push(`Frame: ${FRAME_COLOR_NAMES[data.frameColor] || 'Custom'}`);
    }
    return lines.join('\n');
  };

  const renderSketchDetails = (sketchData: ProductData) => (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {sketchData.type === 'door' ? `${sketchData.doorType} Door` : 'Window'}
      </span>
      <span>{sketchData.width} × {sketchData.height} {sketchData.unit}</span>
      <span>{sketchData.panels}P • {sketchData.openingPanels?.length || 0} opening</span>
    </div>
  );

  if (loading) return <div className="p-6">Loading quotation data...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Quotation' : 'New Quotation'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            {pdfLoading ? 'Generating...' : 'PDF'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Items Table */}
        <Card>
          <CardHeader className="py-3 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t pt-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Client:</span>
                {selectedClient ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-sm truncate">{selectedClient.name}</span>
                    {selectedClient.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{selectedClient.phone}
                      </span>
                    )}
                    {selectedClient.address && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{selectedClient.address}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No client selected</span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowClientSelector(true)}>
                {selectedClient ? 'Change' : 'Select Client'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile cards */}
            <div className="md:hidden space-y-3 p-3">
              {(formData.items as QuotationItem[]).map((item, index) => (
                <div key={index} className="rounded-lg border bg-card p-3 space-y-3 relative">
                  {/* Header: # + remove */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                    <button type="button" onClick={() => handleRemoveItem(index)}
                      disabled={(formData.items as QuotationItem[]).length <= 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Sketch + Item name row */}
                  <div className="flex gap-3">
                    {/* Sketch thumbnail */}
                    <div className="shrink-0">
                      {item.productSketch ? (
                        <div className="flex flex-col gap-1">
                          <div className="rounded border bg-muted/30 p-1 cursor-pointer hover:bg-muted/50 transition-colors w-[100px] h-[70px]"
                               onClick={() => handleOpenSketch(index)}>
                            <ShapeCanvas {...extractShapeCanvasProps(item.productSketch)} svgStyle={{ width: '100%', height: '100%' }} />
                          </div>
                          {renderSketchDetails(item.productSketch)}
                          <div className="flex flex-wrap gap-1">
                            <button type="button" onClick={() => handleOpenSketch(index)}
                              className="text-[10px] text-primary hover:underline">Edit</button>
                            <span className="text-muted-foreground text-[10px]">·</span>
                            <button type="button" onClick={() => handleRemoveSketch(index)}
                              className="text-[10px] text-destructive hover:underline">Remove</button>
                            <span className="text-muted-foreground text-[10px]">·</span>
                            <button type="button" onClick={() => { setSaveTemplateData(item.productSketch!); setShowSaveTemplateDialog(true); }}
                              className="text-[10px] text-primary hover:underline">Save Template</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button type="button" onClick={() => handleOpenSketch(index)}
                            className="flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-2 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Image className="h-3 w-3" />
                            Sketch
                          </button>
                          <button type="button" onClick={() => { setTemplateTargetIndex(index); setShowTemplatePicker(true); }}
                            className="flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-2 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <LayoutTemplate className="h-3 w-3" />
                            Template
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Item name + description */}
                    <div className="flex-1 space-y-1.5">
                      <Input value={item.item} onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        placeholder="Item name" className="h-8 text-sm" required />
                      <Textarea value={item.description ?? ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Description" className="text-sm min-h-[48px]" rows={2} />
                    </div>
                  </div>

                  {/* Numbers: 2x2 grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input type="number" value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="h-8 text-sm" required />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rate</Label>
                      <Input type="number" min="0" step="0.01" value={item.rate ?? ''}
                        onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                        placeholder="—" className="h-8 text-sm" />
                      {item.productSketch && item.rate && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          {(() => {
                            const { width, height, unit } = item.productSketch;
                            const w = toMeters(Number(width), unit);
                            const h = toMeters(Number(height), unit);
                            return !isNaN(w) && !isNaN(h) ? `${(w * h).toFixed(2)} m²` : '';
                          })()}
                        </span>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input type="number" min="0" step="0.01" value={item.price}
                        onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))}
                        className="h-8 text-sm" required
                        readOnly={!!(item.rate !== undefined && item.productSketch)}
                        disabled={!!(item.rate !== undefined && item.productSketch)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <div className="h-8 flex items-center text-sm font-medium">
                        {formatAmount(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile add item button */}
            <div className="md:hidden pt-2 px-3 pb-3">
              <button type="button" onClick={handleAddItem}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                <Plus className="h-3.5 w-3.5" />
                Add another item
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-[250px]">Sketch</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-16">Qty</TableHead>
                  <TableHead className="w-24">Rate</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-24 text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(formData.items as QuotationItem[]).map((item, index) => (
                  <TableRow key={index} className="align-top">
                    {/* Row number */}
                    <TableCell className="text-muted-foreground font-medium pt-4">
                      {index + 1}
                    </TableCell>

                    {/* Sketch thumbnail */}
                    <TableCell className="pt-3">
                      {item.productSketch ? (
                        <div className="flex flex-col gap-1">
                          <div className="cursor-pointer w-[180px] h-[110px]" onClick={() => handleOpenSketch(index)}>
                            <ShapeCanvas {...extractShapeCanvasProps(item.productSketch)} svgStyle={{ width: '100%', height: '100%' }} />
                          </div>
                          <div className="flex gap-1 justify-center">
                            <button type="button" onClick={() => handleOpenSketch(index)}
                              className="text-[10px] text-primary hover:underline">Edit</button>
                            <span className="text-muted-foreground text-[10px]">·</span>
                            <button type="button" onClick={() => handleRemoveSketch(index)}
                              className="text-[10px] text-destructive hover:underline">Remove</button>
                            <span className="text-muted-foreground text-[10px]">·</span>
                            <button type="button" onClick={() => { setSaveTemplateData(item.productSketch!); setShowSaveTemplateDialog(true); }}
                              className="text-[10px] text-primary hover:underline">Save Template</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleOpenSketch(index)}
                            className="flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Image className="h-3 w-3" />
                            Sketch
                          </button>
                          <button type="button" onClick={() => { setTemplateTargetIndex(index); setShowTemplatePicker(true); }}
                            className="flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <LayoutTemplate className="h-3 w-3" />
                            Template
                          </button>
                        </div>
                      )}
                    </TableCell>

                    {/* Item name */}
                    <TableCell className="pt-3">
                      <Input
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        placeholder="Item name"
                        className="h-8 text-sm"
                        required
                      />
                    </TableCell>

                    {/* Description */}
                    <TableCell className="pt-3">
                      <Textarea
                        value={item.description ?? ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Add description..."
                        className="text-sm min-h-[60px]"
                        rows={3}
                      />
                    </TableCell>

                    {/* Qty */}
                    <TableCell className="pt-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="h-8 text-sm w-16"
                        required
                      />
                    </TableCell>

                    {/* Rate */}
                    <TableCell className="pt-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate ?? ''}
                        onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                        placeholder="—"
                        className="h-8 text-sm w-24"
                      />
                      {item.productSketch && item.rate && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          {(() => {
                            const { width, height, unit } = item.productSketch;
                            const w = toMeters(Number(width), unit);
                            const h = toMeters(Number(height), unit);
                            return !isNaN(w) && !isNaN(h) ? `${(w * h).toFixed(2)} m²` : '';
                          })()}
                        </span>
                      )}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="pt-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))}
                        className="h-8 text-sm w-24"
                        required
                        readOnly={!!(item.rate !== undefined && item.productSketch)}
                        disabled={!!(item.rate !== undefined && item.productSketch)}
                      />
                    </TableCell>

                    {/* Total */}
                    <TableCell className="pt-4 text-right font-medium">
                      {formatAmount(item.total)}
                    </TableCell>

                    {/* Remove */}
                    <TableCell className="pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={(formData.items as QuotationItem[]).length <= 1}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add item row */}
            <div className="border-t px-4 py-2">
              <button type="button" onClick={handleAddItem}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                <Plus className="h-3.5 w-3.5" />
                Add another item
              </button>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes + Total + Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6 mt-4">
          <div className="flex-1 md:max-w-md w-full">
            <Label htmlFor="notes" className="text-sm mb-1.5">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes (optional)"
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            <div className="text-left md:text-right">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <div className="text-2xl font-bold">{formatAmount(formData.total_amount)}</div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update Quotation' : 'Save Quotation'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Modals */}
      <QuotationPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <div className="mb-4 px-2">
          <h2 className="text-lg font-semibold">Quotation Preview</h2>
        </div>
        <div className="overflow-auto max-h-[80vh]">
          <QuotationPDFPreview
            clientName={selectedClient?.name || 'Client Name'}
            clientPhone={selectedClient?.phone}
            clientAddress={selectedClient?.address}
            items={formData.items.map(item => ({ ...item, total: item.quantity * item.price }))}
            totalAmount={calculateTotal(formData.items)}
            quotationId={formData.id}
            createdAt={formData.created_at}
          />
        </div>
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
            <Button variant="outline" onClick={() => { setShowSaveTemplateDialog(false); setSaveTemplateData(null); setTemplateName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationForm;
