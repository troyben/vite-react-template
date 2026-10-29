import type { QuotationItem } from '@/services/quotationService';
import type { ProductData } from '@/components/product-editor/types';

export interface QuotationItemEditing {
  onChange: (index: number, field: keyof QuotationItem | 'rate', value: string | number) => void;
  onAdd: () => void; onRemove: (index: number) => void; onSketch: (index: number) => void;
  onRemoveSketch: (index: number) => void; onTemplate: (index: number) => void; onSaveTemplate: (product: ProductData) => void;
}
