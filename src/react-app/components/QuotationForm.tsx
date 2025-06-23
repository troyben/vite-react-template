import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuotationById, createQuotation, updateQuotation } from '../services/quotationService';
import { getAllClients } from '../services/clientService';
import { exportQuotationToPDF } from '../utils/pdfExport';
import type { Client } from '../services/clientService';
import type { QuotationItem, QuotationFormData, Quotation } from '../services/quotationService';
import ProductSketch, { type ProductData } from './ProductSketch';
import ClientSelector from './ClientSelector';
import QuotationPreviewModal from './QuotationPreviewModal';
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

  // Improved mini preview for panels/openings: show open panels with more gap and better perspective
  const renderMiniPreviewPanel = (sketch: ProductData, panelIndex: number) => {
    const isOpening = sketch.openingPanels?.includes(panelIndex);
    const openingDirection = sketch.openingDirections?.[panelIndex];
    const division = sketch.panelDivisions?.find(d => d.panelIndex === panelIndex);
    const isSliding = sketch.type === 'door' && sketch.doorType === 'sliding';

    const frameColor = sketch.frameColor || '#C0C0C0';
    const glassColor =
      sketch.glassType === 'clear'
        ? 'rgba(200,200,255,0.3)'
        : sketch.glassType === 'frosted'
        ? 'rgba(255,255,255,0.8)'
        : sketch.glassType === 'custom-tint'
        ? `${sketch.customGlassTint || '#AEEEEE'}80`
        : 'rgba(200,200,255,0.3)';
    const divisionBorder =
      frameColor === '#4F4F4F'
        ? '#BDBDBD'
        : frameColor === '#CD7F32'
        ? '#A67C52'
        : 'rgba(0,0,0,0.18)';
    const openingHighlight = isOpening ? 'rgba(124, 93, 250, 0.18)' : glassColor;

    // --- Opening transform and shadow for mini preview ---
    const getTransform = () => {
      if (!isOpening) return 'none';
      if (isSliding) {
        // Slide left/right with more gap
        if (openingDirection === 'left') return 'translateX(-50%)';
        if (openingDirection === 'right') return 'translateX(50%)';
        return 'none';
      }
      // Hinged: rotate with more perspective and gap
      switch (openingDirection) {
        case 'left':
          return 'perspective(1200px) translateX(-24%) rotateY(-55deg) scaleX(0.97)';
        case 'right':
          return 'perspective(1200px) translateX(24%) rotateY(55deg) scaleX(0.97)';
        case 'top':
          return 'perspective(1200px) translateY(-16%) rotateX(50deg) scaleY(0.97)';
        case 'bottom':
          return 'perspective(1200px) translateY(16%) rotateX(-50deg) scaleY(0.97)';
        default:
          return 'none';
      }
    };
    const getTransformOrigin = () => {
      if (!isOpening) return 'center';
      switch (openingDirection) {
        case 'left': return 'left center';
        case 'right': return 'right center';
        case 'top': return 'center top';
        case 'bottom': return 'center bottom';
        default: return 'center';
      }
    };
    const getBoxShadow = () => {
      if (!isOpening) return 'none';
      return '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
    };

    // --- Division grid ---
    if (division && (division.horizontalCount > 1 || division.verticalCount > 1)) {
      const cells = [];
      for (let row = 0; row < division.horizontalCount; row++) {
        for (let col = 0; col < division.verticalCount; col++) {
          const isPaneOpening =
            sketch.openingPanes?.some(
              (p) =>
                p.panelIndex === panelIndex &&
                p.rowIndex === row &&
                p.colIndex === col
            ) ?? false;
          // Opening pane transform
          let paneTransform = 'none';
          let paneOrigin = 'center';
          let paneShadow = 'none';
          let marginStyle: React.CSSProperties = {};
          if (isPaneOpening) {
            const paneDir = sketch.openingPanes?.find(
              (p) =>
                p.panelIndex === panelIndex &&
                p.rowIndex === row &&
                p.colIndex === col
            )?.openingDirection;
            switch (paneDir) {
              case 'left':
                paneTransform = 'perspective(1200px) translateX(-18%) rotateY(-55deg) scaleX(0.97)';
                paneOrigin = 'left center';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginLeft: '16px' };
                break;
              case 'right':
                paneTransform = 'perspective(1200px) translateX(18%) rotateY(55deg) scaleX(0.97)';
                paneOrigin = 'right center';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginRight: '16px' };
                break;
              case 'top':
                paneTransform = 'perspective(1200px) translateY(-20%) rotateX(50deg) scaleY(0.97)';
                paneOrigin = 'center top';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginTop: '10px' };
                break;
              case 'bottom':
                paneTransform = 'perspective(1200px) translateY(10%) rotateX(-50deg) scaleY(0.97)';
                paneOrigin = 'center bottom';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginBottom: '10px' };
                break;
              default:
                break;
            }
          }
          cells.push(
            <div
              key={`cell-${row}-${col}`}
              style={{
                border: `1px solid ${divisionBorder}`,
                background: isPaneOpening
                  ? 'rgba(124, 93, 250, 0.18)'
                  : glassColor,
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                borderRadius: 0,
                transition: 'background 0.2s, transform 0.3s',
                transform: paneTransform,
                transformOrigin: paneOrigin,
                boxShadow: paneShadow,
                ...marginStyle,
              }}
            />
          );
        }
      }
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
            gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
            width: '100%',
            height: '100%',
            border: `1.5px solid ${frameColor}`,
            borderRadius: 0,
            background: '#f8fafd',
            overflow: 'hidden',
            minHeight: 60,
            minWidth: 60,
          }}
        >
          {cells}
        </div>
      );
    }

    // --- Single panel ---
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `1.5px solid ${frameColor}`,
          borderRadius: 0,
          background: openingHighlight,
          boxSizing: 'border-box',
          minHeight: 60,
          minWidth: 60,
          transform: getTransform(),
          transformOrigin: getTransformOrigin(),
          transition: 'transform 0.3s, box-shadow 0.3s',
          boxShadow: getBoxShadow(),
          marginLeft: isOpening && openingDirection === 'left' ? '24px' : undefined,
          marginRight: isOpening && openingDirection === 'right' ? '24px' : undefined,
          marginTop: isOpening && openingDirection === 'top' ? '14px' : undefined,
          marginBottom: isOpening && openingDirection === 'bottom' ? '14px' : undefined,
        }}
      />
    );
  };

  // --- Dimension lines for the preview ---
  const renderMiniPreviewDimensionLines = (sketch: ProductData, widthPx: number, heightPx: number) => {
    const { width, height, unit, panels, panelWidths } = sketch;
    const frameWidth = widthPx;
    const frameHeight = heightPx;
    const offset = 10;

    // Panel widths in px: always divide frameWidth equally, regardless of panelWidths values
    const panelPixelWidths = Array(panels).fill(frameWidth / panels);

    // Calculate x positions for panel boundaries (fixed equal parts)
    let acc = 0;
    const panelBoundaries = panelPixelWidths.map((w, i) => {
      const start = acc;
      acc += w;
      return { start, end: acc, width: w, index: i };
    });

    return (
      <>
        {/* Panel widths dimension lines at the top */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `-${offset + 5}px`,
            transform: `translateX(-50%)`,
            width: `${frameWidth}px`,
            height: '24px',
            pointerEvents: 'none',
            zIndex: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: 0 }}>
            {panelBoundaries.map((panel, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${panel.start}px`,
                  top: "-5px",
                  width: `${panel.width}px`,
                  height: 0,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: `${panel.width}px`,
                    height: 0,
                    borderTop: '1px dashed #BDBDBD',
                    top: 0,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '7px solid #BDBDBD',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${panel.width - 7}px`,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '7px solid #BDBDBD',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: "-20px",
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#7E88C3',
                    fontWeight: 500,
                    fontSize: 10,
                    padding: '0 8px',
                    borderRadius: 3,
                    border: '1px solid #DFE3FA',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {panelWidths ? panelWidths[i] : Math.round(width / panels)} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom horizontal dimension (width) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${frameHeight - 10}px`,
            transform: `translateX(-50%)`,
            width: `${frameWidth}px`,
            height: '20px',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: 0 }}>
            <div
              style={{
                width: '100%',
                height: 0,
                borderTop: '1px solid #7E88C3',
                position: 'absolute',
                top: 10,
                left: 0,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 2,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid #7E88C3',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 2,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '10px solid #7E88C3',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: 16,
                transform: 'translateX(-50%)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 10,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid #DFE3FA',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap'
              }}
            >
              {width} {unit}
            </span>
          </div>
        </div>
        {/* Left vertical dimension (height) */}
        <div
          style={{
            position: 'absolute',
            left: `-${offset + 25}px`,
            top: '50%',
            transform: `translateY(-50%)`,
            height: `${frameHeight}px`,
            width: '32px',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', height: '100%', width: 0 }}>
            <div
              style={{
                height: '100%',
                width: 0,
                borderLeft: '1px solid #7E88C3',
                position: 'absolute',
                left: 10,
                top: 0,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 2,
                top: 0,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '10px solid #7E88C3',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 2,
                bottom: 0,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #7E88C3',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 25,
                top: '50%',
                transform: 'translate(-100%, -50%) rotate(-90deg)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 10,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid #DFE3FA',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap',
              }}
            >
              {height} {unit}
            </span>
          </div>
        </div>
      </>
    );
  };


  const MiniSketchPreview: React.FC<{ sketch?: ProductData }> = ({ sketch }) => {
    if (!sketch) return null;
    const panelCount = sketch.panels || 1;
    const frameColor = sketch.frameColor || '#C0C0C0';
    const widthPx = 320;
    const heightPx = 160;

    // Use panelWidths if available, else equal widths
    const panelWidths =
      sketch.panelWidths && sketch.panelWidths.length === panelCount
        ? sketch.panelWidths
        : Array(panelCount).fill(1);

    // Normalize widths for flex
    const total = panelWidths.reduce((a, b) => a + b, 0);
    const flexes = panelWidths.map((w) => w / total);

    return (
      <div style={{ position: 'relative', width: widthPx, height: heightPx, margin: '0 auto' }}>
        {/* Dimension lines */}
        {renderMiniPreviewDimensionLines(sketch, widthPx, heightPx)}
        {/* Panels */}
        <div
          style={{
            display: 'flex',
            width: widthPx,
            height: heightPx,
            border: `2px solid ${frameColor}`,
            borderRadius: 0,
            overflow: 'hidden',
            background: '#f8fafd',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 2
          }}
        >
          {Array.from({ length: panelCount }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: flexes[i],
                height: '100%',
                minWidth: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'stretch'
              }}
            >
              {renderMiniPreviewPanel(sketch, i)}
            </div>
          ))}
        </div>
      </div>
    );
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="page-title">{isEditing ? 'Edit Quotation' : 'Create New Quotation'}</h1>
          <Link to="/quotations" className="btn btn-secondary">
            Back to List
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: 8 }}
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                      <path d="M8 1V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
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
                        {/* X icon */}
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                          <path d="M3 3L15 15M3 15L15 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
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
                              <div style={{ minWidth: 120, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MiniSketchPreview sketch={item.productSketch} />
                              </div>
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

        {/* Preview Modal */}
        <QuotationPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
          {/* --- Place the preview content here (copied from the old right-side preview) --- */}
          <div className="quotation-preview">
            <div className="preview-header">
              <h2 className="preview-title">Preview</h2>
              <div className="preview-actions">
                <button onClick={handleDownloadPDF} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                    <path d="M8 1V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.5 7.5L8 12L12.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 14H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
                      <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3333 10.6233V12.62C13.3343 12.7967 13.2964 12.9716 13.2223 13.1336C13.1482 13.2956 13.0395 13.4407 12.9034 13.5594C12.7672 13.678 12.6067 13.7677 12.4323 13.8228C12.2579 13.8779 12.0737 13.8973 11.8917 13.88C10.1252 13.6877 8.42769 13.0732 6.94999 12.08C5.57516 11.1723 4.41297 10.0101 3.50533 8.63499C2.50666 7.14962 1.89187 5.44364 1.70133 3.66833C1.68403 3.48695 1.70328 3.30335 1.75798 3.1294C1.81268 2.95546 1.90191 2.79515 2.01991 2.65895C2.13791 2.52274 2.28215 2.4137 2.44341 2.33895C2.60468 2.26419 2.77887 2.22538 2.95499 2.22499H4.95199C5.26472 2.22186 5.56743 2.33192 5.80174 2.53529C6.03605 2.73865 6.18382 3.01957 6.21999 3.32999C6.28626 3.96002 6.43145 4.58122 6.65133 5.17833C6.7366 5.39856 6.75938 5.6383 6.71692 5.87089C6.67446 6.10349 6.56842 6.31859 6.41066 6.48499L5.61533 7.28033C6.45143 8.7056 7.62909 9.88326 9.05433 10.7193L9.84966 9.92399C10.016 9.76623 10.2311 9.66019 10.4637 9.61773C10.6963 9.57527 10.936 9.59805 11.1563 9.68333C11.7534 9.9032 12.3746 10.0484 13.0047 10.1147C13.3184 10.1514 13.6019 10.3017 13.8059 10.54C14.01 10.7784 14.1178 11.0851 14.11 11.4V10.6233H13.3333Z" fill="currentColor"/>
                      </svg>
                      <div className="preview-client-phone">{selectedClient.phone}</div>
                    </div>
                  )}
                  
                  {selectedClient?.address && (
                    <div className="preview-client-detail">
                      <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1.5C6.67392 1.5 5.40215 2.02678 4.46447 2.96447C3.52678 3.90215 3 5.17392 3 6.5C3 9.5 8 14.5 8 14.5C8 14.5 13 9.5 13 6.5C13 5.17392 12.4732 3.90215 11.5355 2.96447C10.5979 2.02678 9.32608 1.5 8 1.5ZM8 8C7.60444 8 7.21776 7.8827 6.88886 7.66294C6.55996 7.44318 6.30362 7.13082 6.15224 6.76537C6.00087 6.39991 5.96126 5.99778 6.03843 5.60982C6.1156 5.22186 6.30608 4.86549 6.58579 4.58579C6.86549 4.30608 7.22186 4.1156 7.60982 4.03843C7.99778 3.96126 8.39991 4.00087 8.76537 4.15224C9.13082 4.30362 9.44318 4.55996 9.66294 4.88886C9.8827 5.21776 10 5.60444 10 6C10 6.53043 9.78929 7.03914 9.41421 7.41421C9.03914 7.78929 8.53043 8 8 8Z" fill="currentColor"/>
                      </svg>
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
                                <div className="preview-sketch-visual" style={{ minWidth: 120, minHeight: 60, marginTop: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <MiniSketchPreview sketch={item.productSketch} />
                                </div>
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