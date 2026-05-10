import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductEditor, {
  type ProductEditorHandle,
} from '@/components/product-editor/ProductEditor';
import type { ProductData } from '@/components/product-editor/types';

interface ProductEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ProductData;
  onSave: (data: ProductData) => void;
}

/**
 * Thin Dialog wrapper around the shared <ProductEditor mode="dialog">.
 * All editor state, canvas wiring, tab orchestration, and handler factories
 * live inside ProductEditor. This component only owns the modal shell.
 */
const ProductEditorDialog: React.FC<ProductEditorDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
}) => {
  const editorRef = useRef<ProductEditorHandle>(null);

  if (!open) return null;

  const handleSave = (data: ProductData) => {
    onSave(data);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>Product Configuration</DialogTitle>
        </DialogHeader>

        <ProductEditor
          ref={editorRef}
          mode="dialog"
          initialData={initialData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditorDialog;
