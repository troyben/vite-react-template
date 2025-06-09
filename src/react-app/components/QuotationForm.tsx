import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { type Quotation, type QuotationItem } from '../services/api';
import ProductSketch, { type ProductData } from './ProductSketch';
import ClientSelector from './ClientSelector';
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

  const [formData, setFormData] = useState<Quotation>({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    items: [{ ...emptyItem }],
    total_amount: 0,
    status: 'draft'
  });

  const [loading, setLoading] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSketchDialog, setShowSketchDialog] = useState<boolean>(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [showClientSelector, setShowClientSelector] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!isEditing) return;
      
      try {
        setLoading(true);
        const data = await api.getQuotationById(parseInt(id));
        setFormData({
          ...data,
          items: Array.isArray(data.items) ? data.items : []
        });
      } catch (err) {
        console.error('Error fetching quotation:', err);
        setError('Failed to fetch quotation details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id, isEditing]);

  const calculateTotal = (items: QuotationItem[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Recalculate total if quantity or price changes
      if (field === 'quantity' || field === 'price') {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClientSelect = (client: any) => {
    setFormData({
      ...formData,
      client_name: client.name,
      client_email: client.email,
      client_phone: client.phone || '',
      client_address: client.company || ''
    });
    setShowClientSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (isEditing) {
        await api.updateQuotation(parseInt(id), formData);
      } else {
        await api.createQuotation(formData);
      }
      
      navigate('/');
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError('Failed to save quotation. Please try again.');
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality would be implemented here');
    // In a real app, this would generate and download a PDF
  };

  const handleSendEmail = () => {
    alert('Email sending functionality would be implemented here');
    // In a real app, this would send the quotation via email
  };

  const handleOpenSketch = (index: number) => {
    setCurrentItemIndex(index);
    setShowSketchDialog(true);
  };

  const handleSaveSketch = (productData: ProductData) => {
    const updatedItems = (formData.items as QuotationItem[]).map((item, i) => {
      if (i !== currentItemIndex) return item;
      
      return {
        ...item,
        productSketch: {
          ...productData,
          sketchSvg: productData.sketchSvg || '',
          openingPanels: productData.openingPanels || [],
          panelDivisions: productData.panelDivisions || [],
          openingPanes: productData.openingPanes || []
        }
      };
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
    
    setShowSketchDialog(false);
  };

  const handleCancelSketch = () => {
    setShowSketchDialog(false);
    setCurrentItemIndex(-1);
  };

  if (loading) return <div>Loading quotation data...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Quotation' : 'Create New Quotation'}</h1>
        <Link to="/quotations" className="btn btn-secondary">
          Back to List
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="quotation-form-container">
        {/* Form section - left side */}
        <div className="quotation-form">
          <form onSubmit={handleSubmit}>
            <div className="client-section">
              <div className="section-header" style={{ alignItems: 'flex-end', gap: '16px' }}>
                <h3>Client Information</h3>
                <div className="select-client-btn-wrapper">
                  <button
                    type="button"
                    className="btn btn-secondary select-client-btn"
                    onClick={() => setShowClientSelector(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                      <path d="M8 1V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {formData.client_name ? 'Change Client' : 'Select Client'}
                  </button>
                </div>
              </div>

              {formData.client_name && (
                <div className="selected-client-summary" style={{ margin: '12px 0 20px 0', padding: '12px', background: '#f9fafe', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{formData.client_name}</span>
                  <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>{formData.client_email}</span>
                  {formData.client_address && <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>{formData.client_address}</span>}
                  {formData.client_phone && <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>{formData.client_phone}</span>}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client_name">Client Name *</label>
                  <input
                    type="text"
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client_email">Client Email *</label>
                  <input
                    type="email"
                    id="client_email"
                    name="client_email"
                    value={formData.client_email}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client_phone">Telephone/Mobile</label>
                  <input
                    type="tel"
                    id="client_phone"
                    name="client_phone"
                    value={formData.client_phone || ''}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter client's phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client_address">Address</label>
                  <input
                    type="text"
                    id="client_address"
                    name="client_address"
                    value={formData.client_address || ''}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter client's address"
                  />
                </div>
              </div>
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
                  <div key={index} className="item-card">
                    <div className="item-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="item-number">Item #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="btn-icon-round remove-item-btn"
                        disabled={(formData.items as QuotationItem[]).length <= 1}
                        title="Remove this item"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
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
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Price *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Total</label>
                          <input
                            type="text"
                            value={`£${item.total.toFixed(2)}`}
                            className="form-control"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="item-sketch">
                        {item.productSketch ? (
                          <div className="sketch-preview">
                            <div className="sketch-preview-image" dangerouslySetInnerHTML={{ __html: item.productSketch.sketchSvg || '' }} />
                            <div className="sketch-details">
                              <p><strong>{item.productSketch.type === 'window' ? 'Window' : 'Door'}</strong>: {item.productSketch.width}cm × {item.productSketch.height}cm</p>
                              <p>Panels: {item.productSketch.panels} (Opening: {(item.productSketch.openingPanels?.length || 0)})</p>
                              {item.productSketch.type === 'door' && <p>Door Type: {item.productSketch.doorType}</p>}
                              {item.productSketch.panelDivisions && item.productSketch.panelDivisions.length > 0 && (
                                <p>
                                  Divided Panels: {item.productSketch.panelDivisions.map(div => 
                                    `Panel ${div.panelIndex + 1} (${div.horizontalCount}×${div.verticalCount})`
                                  ).join(', ')}
                                </p>
                              )}
                              <button 
                                type="button" 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleOpenSketch(index)}
                              >
                                Edit Sketch
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-add-sketch"
                            onClick={() => handleOpenSketch(index)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                              <path d="M15 10L8 3L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M3 8V14H13V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Add Product Sketch
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={handleAddItem} className="btn btn-secondary add-item-btn-full" style={{marginTop: '16px', width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path d="M7 1V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
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

        {/* Preview section - right side */}
        <div className="quotation-preview">
          <div className="preview-header">
            <h2 className="preview-title">Preview</h2>
            <div className="preview-actions">
              <button onClick={handleSendEmail} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path d="M14 3H2C1.44772 3 1 3.44772 1 4V12C1 12.5523 1.44772 13 2 13H14C14.5523 13 15 12.5523 15 12V4C15 3.44772 14.5523 3 14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 4L8 8.5L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send
              </button>
              <button onClick={handleDownloadPDF} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path d="M8 1V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 7.5L8 12L12.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 14H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
              <button onClick={handlePrint} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path d="M4 6V1H12V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12H2C1.44772 12 1 11.5523 1 11V7C1 6.44772 1.44772 6 2 6H14C14.5523 6 15 6.44772 15 7V11C15 11.5523 14.5523 12 14 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 9H12V15H4V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Print
              </button>
            </div>
          </div>
          
          <div className="preview-content">
            <div className="preview-section">
              <div className="preview-section-title">Quotation</div>
              <div className="preview-client">
                <div className="preview-client-name">{formData.client_name || 'Client Name'}</div>
                
                <div className="preview-client-detail">
                  <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 3H2C1.45 3 1 3.45 1 4V12C1 12.55 1.45 13 2 13H14C14.55 13 15 12.55 15 12V4C15 3.45 14.55 3 14 3ZM14 5L8 8.5L2 5V4L8 7.5L14 4V5Z" fill="currentColor"/>
                  </svg>
                  <div className="preview-client-email">{formData.client_email || 'client@example.com'}</div>
                </div>
                
                {formData.client_phone && (
                  <div className="preview-client-detail">
                    <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3333 10.6233V12.62C13.3343 12.7967 13.2964 12.9716 13.2223 13.1336C13.1482 13.2956 13.0395 13.4407 12.9034 13.5594C12.7672 13.678 12.6067 13.7677 12.4323 13.8228C12.2579 13.8779 12.0737 13.8973 11.8917 13.88C10.1252 13.6877 8.42769 13.0732 6.94999 12.08C5.57516 11.1723 4.41297 10.0101 3.50533 8.63499C2.50666 7.14962 1.89187 5.44364 1.70133 3.66833C1.68403 3.48695 1.70328 3.30335 1.75798 3.1294C1.81268 2.95546 1.90191 2.79515 2.01991 2.65895C2.13791 2.52274 2.28215 2.4137 2.44341 2.33895C2.60468 2.26419 2.77887 2.22538 2.95499 2.22499H4.95199C5.26472 2.22186 5.56743 2.33192 5.80174 2.53529C6.03605 2.73865 6.18382 3.01957 6.21999 3.32999C6.28626 3.96002 6.43145 4.58122 6.65133 5.17833C6.7366 5.39856 6.75938 5.6383 6.71692 5.87089C6.67446 6.10349 6.56842 6.31859 6.41066 6.48499L5.61533 7.28033C6.45143 8.7056 7.62909 9.88326 9.05433 10.7193L9.84966 9.92399C10.016 9.76623 10.2311 9.66019 10.4637 9.61773C10.6963 9.57527 10.936 9.59805 11.1563 9.68333C11.7534 9.9032 12.3746 10.0484 13.0047 10.1147C13.3184 10.1514 13.6019 10.3017 13.8059 10.54C14.01 10.7784 14.1178 11.0851 14.11 11.4V10.6233H13.3333Z" fill="currentColor"/>
                    </svg>
                    <div className="preview-client-phone">{formData.client_phone}</div>
                  </div>
                )}
                
                {formData.client_address && (
                  <div className="preview-client-detail">
                    <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1.5C6.67392 1.5 5.40215 2.02678 4.46447 2.96447C3.52678 3.90215 3 5.17392 3 6.5C3 9.5 8 14.5 8 14.5C8 14.5 13 9.5 13 6.5C13 5.17392 12.4732 3.90215 11.5355 2.96447C10.5979 2.02678 9.32608 1.5 8 1.5ZM8 8C7.60444 8 7.21776 7.8827 6.88886 7.66294C6.55996 7.44318 6.30362 7.13082 6.15224 6.76537C6.00087 6.39991 5.96126 5.99778 6.03843 5.60982C6.1156 5.22186 6.30608 4.86549 6.58579 4.58579C6.86549 4.30608 7.22186 4.1156 7.60982 4.03843C7.99778 3.96126 8.39991 4.00087 8.76537 4.15224C9.13082 4.30362 9.44318 4.55996 9.66294 4.88886C9.8827 5.21776 10 5.60444 10 6C10 6.53043 9.78929 7.03914 9.41421 7.41421C9.03914 7.78929 8.53043 8 8 8Z" fill="currentColor"/>
                    </svg>
                    <div className="preview-client-address">{formData.client_address}</div>
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
                        <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>{item.description}</div>
                        {item.productSketch && (
                          <div className="preview-item-sketch">
                            <div dangerouslySetInnerHTML={{ __html: item.productSketch.sketchSvg || '' }} />
                            <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                              <strong>{item.productSketch.type === 'window' ? 'Window' : 'Door'}</strong>: {item.productSketch.width}×{item.productSketch.height}cm
                              {item.productSketch.type === 'door' ? `, ${item.productSketch.doorType}` : ''}
                              {item.productSketch.panelDivisions && item.productSketch.panelDivisions.length > 0 ? `, ${item.productSketch.panelDivisions.length} divided panel(s)` : ''}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>£{item.price.toFixed(2)}</td>
                      <td className="text-right">£{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="preview-total">
                <div className="preview-total-label">Total Amount</div>
                <div className="preview-total-value">£{formData.total_amount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showClientSelector && (
        <div className="modal-overlay">
          <div className="modal-container">
            <ClientSelector
              onSelect={handleClientSelect}
              selectedClient={null}
            />
          </div>
        </div>
      )}

      {showSketchDialog && (
        <div className="product-sketch-modal">
          <div className="product-sketch-container">
            <ProductSketch
              onSave={handleSaveSketch}
              onCancel={handleCancelSketch}
              initialData={(formData.items as QuotationItem[])[currentItemIndex]?.productSketch || {
                type: 'window',
                doorType: 'traditional',
                width: 100,
                height: 100,
                panels: 1
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;