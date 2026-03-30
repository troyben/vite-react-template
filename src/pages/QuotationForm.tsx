import { useState, useEffect } from 'react';
import { Plus, X, Image, Download, Phone, MapPin } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuotationById, createQuotation, updateQuotation } from '../services/quotationService';
import { getAllClients } from '../services/clientService';
import { exportQuotationToPDF } from '../utils/pdfExport';
import type { Client } from '../services/clientService';
import type { QuotationItem, QuotationFormData, Quotation } from '../services/quotationService';
import ProductSketch, { type ProductData } from '@/components/ProductSketch';
import ClientSelector from '@/components/ClientSelector';
import QuotationPreviewModal from '@/components/QuotationPreviewModal';
import MiniSketchPreview from '@/components/MiniSketchPreview';
import '../styles/QuotationForm.css';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const clientsResponse = await getAllClients();
        
        if (isEditing && id) {
          const quotationResponse = await getQuotationById(parseInt(id));
          if (quotationResponse.data.success) {
            const quotationData = quotationResponse.data.data;
            
            // Parse the items JSON string into an array of objects
            const parsedItems = typeof quotationData.items === 'string' 
              ? JSON.parse(quotationData.items) 
              : quotationData.items;

            // Handle total_amount type conversion
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
              total_amount: total, // Use the converted number
              status: quotationData.status,
              notes: quotationData.notes || ''
            });
            
            // Find and set the selected client
            const clientsData = clientsResponse.data.success ? clientsResponse.data.data : [];
            const client = clientsData.find(c => c.id === quotationData.clientId);
            if (client) {
              setSelectedClient(client);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const calculateTotal = (items: QuotationItem[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // Helper: convert value to meters based on unit
  const toMeters = (value: number, unit: string) => {
    if (unit === 'm') return value;
    if (unit === 'cm') return value / 100;
    if (unit === 'mm') return value / 1000;
    return value;
  };

  // --- Price Calculation with Rate ---
  // Each item can have a 'rate' field, and price is calculated as L x W x Rate (L/W in meters)
  const handleItemChange = (index: number, field: keyof QuotationItem | 'rate', value: string | number) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item: QuotationItem, i: number) => {
      if (i !== index) return item;

      // Add 'rate' field to item if changed
      let updatedItem: any = { ...item, [field]: value };

      // If productSketch exists and rate is set, calculate price
      if (
        updatedItem.productSketch &&
        updatedItem.rate !== undefined &&
        updatedItem.rate !== null &&
        updatedItem.rate !== ''
      ) {
        const { width, height, unit } = updatedItem.productSketch;
        const widthM = toMeters(Number(width), unit);
        const heightM = toMeters(Number(height), unit);
        const rate = Number(updatedItem.rate);
        if (!isNaN(widthM) && !isNaN(heightM) && !isNaN(rate)) {
          updatedItem.price = +(widthM * heightM * rate).toFixed(2);
        }
      }

      // Recalculate total if quantity or price or rate changes
      if (field === 'quantity' || field === 'price' || field === 'rate') {
        updatedItem.total = updatedItem.quantity * updatedItem.price;
      }

      return updatedItem;
    });

    setFormData({
      ...formData,
      items: updatedItems,
      total_amount: calculateTotal(updatedItems)
    });
  };

  const handleAddItem = () => {
    const updatedItems = [...(formData.items as QuotationItem[]), { ...emptyItem }];
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleRemoveItem = (index: number) => {
    if ((formData.items as QuotationItem[]).length <= 1) {
      return;
    }
    
    const updatedItems = (formData.items as QuotationItem[]).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems,
      total_amount: calculateTotal(updatedItems)
    });
  };

  const handleSaveSketch = (productData: ProductData) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== currentItemIndex) return item;
      
      return {
        ...item,
        productSketch: {
          ...productData
          // sketchSvg removed since we're using dynamic styles
        }
      };
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
    
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

  const handleClientSelectorClose = () => {
    setShowClientSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setError('Please select a client first.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const quotationData: Omit<QuotationFormData, 'id'> = {
        clientId: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email || '',
        client_phone: selectedClient.phone || '',
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
          rate: item.rate, // include rate if present
          productSketch: item.productSketch ? {
            ...item.productSketch,
            type: item.productSketch.type,
            width: item.productSketch.width,
            height: item.productSketch.height,
            panels: item.productSketch.panels,
            openingPanels: item.productSketch.openingPanels || [],
            openingDirections: item.productSketch.openingDirections || {},
            frameColor: item.productSketch.frameColor,
            glassType: item.productSketch.glassType
          } : undefined
        })),
        total_amount: calculateTotal(formData.items),
        status: 'draft',
        notes: formData.notes || ''
      };
      
      if (isEditing && id) {
        await updateQuotation(parseInt(id), quotationData);
      } else {
        await createQuotation(quotationData);
      }
      
      navigate('/quotations');
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to save quotation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formData || !selectedClient) {
      // notify.error('Please complete the quotation before generating PDF');
      return;
    }

    try {
      const quotationData: Quotation = {
        id: formData.id || Date.now(),
        clientId: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email || '', // Ensure it's never undefined
        client_phone: selectedClient.phone || undefined,
        client_address: selectedClient.address || '',
        items: formData.items.map(item => ({
          ...item,
          total: item.quantity * item.price
        })),
        total_amount: calculateTotal(formData.items),
        status: formData.status,
        notes: formData.notes || '',
        created_at: formData.created_at || new Date().toISOString(),
        updated_at: formData.updated_at || new Date().toISOString(),
        createdAt: formData.created_at || new Date().toISOString(),
        updatedAt: formData.updated_at || new Date().toISOString()
      };

      await exportQuotationToPDF(quotationData);
      // notify.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      // notify.error('Failed to generate PDF');
    }
  };

  const handleRemoveSketch = (index: number) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const { productSketch, ...itemWithoutSketch } = item;
        return itemWithoutSketch;
      }
      return item;
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Add this helper function near the top of the component
  const formatAmount = (amount: any): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof num === 'number' && !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  const renderSketchDetails = (sketchData: ProductData) => {
    const openingCount = sketchData.openingPanels?.length || 0;
    const dividedPanelsCount = sketchData.panelDivisions?.length || 0;
    const openingPanesCount = sketchData.openingPanes?.length || 0;

    return (
      <div className="sketch-details-grid">
        <div className="sketch-details-main">
          <div className="sketch-type">
            {sketchData.type === 'door' ? `${sketchData.doorType} Door` : 'Window'}
          </div>
          <div className="sketch-dimensions">
            {sketchData.width} × {sketchData.height} {sketchData.unit}
          </div>
        </div>
        <div className="sketch-details-specs">
          <div className="spec-item">
            <span className="spec-label">Panels:</span>
            <span className="spec-value">{sketchData.panels} total ({openingCount} opening)</span>
          </div>
          {dividedPanelsCount > 0 && (
            <div className="spec-item">
              <span className="spec-label">Divisions:</span>
              <span className="spec-value">{dividedPanelsCount} panels with divisions</span>
            </div>
          )}
          {openingPanesCount > 0 && (
            <div className="spec-item">
              <span className="spec-label">Opening Panes:</span>
              <span className="spec-value">{openingPanesCount} panes</span>
            </div>
          )}
          <div className="spec-item">
            <span className="spec-label">Frame:</span>
            <span className="spec-value">
              {sketchData.frameColor === '#C0C0C0' ? 'Natural/Silver' :
               sketchData.frameColor === '#4F4F4F' ? 'Charcoal Grey' :
               sketchData.frameColor === '#CD7F32' ? 'Bronze' : 'Custom'}
            </span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Glass:</span>
            <span className="spec-value">{sketchData.glassType}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading quotation data...</div>;

  return (
    <div>
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{isEditing ? 'Edit Quotation' : 'Create New Quotation'}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/quotations" className="btn btn-secondary">
            Back to List
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPreviewModal(true)}
          >
            View Preview
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="quotation-form-container">
        <div className="quotation-form" style={{ width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div className="client-section" style={{ width: '100%' }}>
              <div className="section-header" style={{ alignItems: 'flex-end', gap: '16px' }}>
                <h3>Client Information</h3>
                <div className="select-client-btn-wrapper">
                  <button
                    type="button"
                    className="btn btn-secondary select-client-btn"
                    onClick={() => setShowClientSelector(true)}
                  >
                    <Plus className="w-4 h-4" style={{ marginRight: '10px' }} />
                    {selectedClient ? 'Change Client' : 'Select Client'}
                  </button>
                </div>
              </div>

              {selectedClient && (
                <div className="selected-client-summary" style={{ margin: '12px 0 20px 0', padding: '12px', background: '#f9fafe', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{selectedClient.name}</span>
                  {selectedClient.address && (
                    <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>{selectedClient.address}</span>
                  )}
                  {selectedClient.phone && (
                    <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>{selectedClient.phone}</span>
                  )}
                </div>
              )}

              {!selectedClient && (
                <div className="no-client-selected">
                  <p>Please select a client to continue</p>
                </div>
              )}
            </div>

            <div className="items-section">
              <div className="items-header">
                <h3>Items</h3>
                <button
                  type="button"
                  className="btn btn-secondary "
                  onClick={handleAddItem}
                >
                  Add Item
                </button>
              </div>
              
              <div className="items-list">
                {(formData.items as QuotationItem[]).map((item, index) => (
                  <div
                    key={index}
                    className="item-card"
                    style={{
                      background: '#F9FAFE',
                      borderRadius: 12,
                      marginBottom: 32,
                      boxShadow: '0 2px 8px rgba(124,93,250,0.04)',
                      border: '1.5px solid #DFE3FA',
                      padding: 24,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: 6,
                        background: `linear-gradient(180deg, #7C5DFA 0%, #6247e0 100%)`,
                        borderRadius: '12px 0 0 12px',
                        opacity: 0.18,
                      }}
                    />
                    <div className="item-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span className="item-number" style={{ fontWeight: 700, color: '#7C5DFA', fontSize: 18 }}>
                        Item #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="btn-icon-round remove-item-btn"
                        disabled={(formData.items as QuotationItem[]).length <= 1}
                        title="Remove this item"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        <X className="w-[18px] h-[18px]" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="item-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Item Name *</label>
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                            className="form-control"
                            placeholder="Enter item name"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="form-control"
                            placeholder="Enter description (optional)"
                          />
                        </div>
                      </div>

                      <div className="item-numbers">
                        <div className="form-group">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            // min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Rate (per m²)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate ?? ''}
                            onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                            className="form-control"
                            placeholder="Enter rate"
                          />
                          {item.productSketch && (
                            <small style={{ color: '#7E88C3', fontSize: 12 }}>
                              Area: {(() => {
                                const { width, height, unit } = item.productSketch;
                                const widthM = toMeters(Number(width), unit);
                                const heightM = toMeters(Number(height), unit);
                                if (!isNaN(widthM) && !isNaN(heightM)) {
                                  return `${widthM.toFixed(2)}m × ${heightM.toFixed(2)}m = ${(widthM * heightM).toFixed(2)} m²`;
                                }
                                return '';
                              })()}
                            </small>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Price *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))}
                            className="form-control"
                            required
                            readOnly={(item.rate !== undefined && item.productSketch) ? true : false}
                            style={item.rate !== undefined && item.productSketch ? { background: '#f3f3f3', color: '#888' } : {}}
                          />
                          {item.rate !== undefined && item.productSketch && (
                            <small style={{ color: '#7E88C3', fontSize: 12 }}>
                              Price = L × W × Rate
                            </small>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Total</label>
                          <input
                            type="text"
                            value={`$${item.total ? item.total.toFixed(2) : '0.00'}`}
                            className="form-control"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="item-sketch">
                        {item.productSketch ? (
                          <div className="sketch-preview">
                            <div className="sketch-preview-container">
                              <div className="sketch-preview-specs">
                                {renderSketchDetails(item.productSketch)}
                              </div>

                              <MiniSketchPreview sketch={item.productSketch} />

                              <div className="sketch-actions">
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleOpenSketch(index)}
                                >
                                  Edit Sketch
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveSketch(index)}
                                >
                                  Clear Sketch
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-add-sketch"
                            onClick={() => handleOpenSketch(index)}
                          >
                            <Image className="w-4 h-4" style={{ marginRight: '8px' }} />
                            Add Product Sketch
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={handleAddItem} className="btn btn-secondary add-item-btn-full" style={{marginTop: '16px', width: '100%' }}>
                <Plus className="w-3.5 h-3.5" style={{ marginRight: '8px' }} />
                Add Another Item
              </button>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/quotations')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Quotation' : 'Create Quotation'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Modal */}
        <QuotationPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
          {/* --- Place the preview content here (copied from the old right-side preview) --- */}
          <div className="quotation-preview">
            <div className="preview-header">
              <h2 className="preview-title">Preview</h2>
              <div className="preview-actions">
                <button onClick={handleDownloadPDF} className="btn btn-secondary">
                  <Download className="w-4 h-4" style={{ marginRight: '8px' }} />
                  Download PDF
                </button>
              </div>
            </div>
            <div className="preview-content">
              <div className="preview-section">
                <div className="preview-section-title">Quotation</div>
                <div className="preview-client">
                  <div className="preview-client-name">{selectedClient?.name || 'Client Name'}</div>
                  
                  {selectedClient?.phone && (
                    <div className="preview-client-detail">
                      <Phone className="preview-icon w-4 h-4" />
                      <div className="preview-client-phone">{selectedClient.phone}</div>
                    </div>
                  )}
                  
                  {selectedClient?.address && (
                    <div className="preview-client-detail">
                      <MapPin className="preview-icon w-4 h-4" />
                      <div className="preview-client-address">{selectedClient.address}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="preview-section">
                <div className="preview-section-title">Items</div>
                <table className="preview-items">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.items as QuotationItem[]).map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div>{item.item || 'Item name'}</div>
                          <div style={{ color: 'var(--text-light)', fontSize: '14px'}}>{item.description}</div>
                          <br />
                          {item.productSketch && (
                            <div className="preview-sketch">
                              <div className="preview-sketch-container">
                                <div className="preview-sketch-info">
                                  {renderSketchDetails(item.productSketch)}
                                </div>

                                <MiniSketchPreview sketch={item.productSketch} />
                                
                              </div>
                            </div>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td className="text-right">{formatAmount(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="preview-total">
                  <div className="preview-total-label">Total Amount</div>
                  <div className="preview-total-value">{formatAmount(formData.total_amount)}</div>
                </div>
              </div>
            </div>
          </div>
        </QuotationPreviewModal>

      {showClientSelector && (
        <ClientSelector
          onSelect={handleClientSelect}
          selectedClient={selectedClient}
          onClose={handleClientSelectorClose}
        />
      )}

      {showSketchDialog && (
        <div className="modal-overlay sketch-modal">
          <ProductSketch
            onSave={handleSaveSketch}
            onCancel={handleCancelSketch}
            initialData={((formData.items as QuotationItem[])[currentItemIndex]?.productSketch as ProductData) || {
              type: 'window',
              width: 100,
              height: 100,
              panels: 1,
              doorType: 'traditional'
            }}
          />
        </div>
      )}
    </div>
    </div>
  );
};

export default QuotationForm;