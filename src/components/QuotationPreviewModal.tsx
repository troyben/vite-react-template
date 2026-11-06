import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QuotationPreviewModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }
const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({ open, onClose, title = 'Quotation Preview', children }) => (
  <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <DialogContent className="flex h-[95dvh] max-h-[95dvh] w-[95vw] max-w-[1100px] flex-col gap-0 overflow-hidden p-0 sm:w-[80vw] sm:max-w-[1100px]" aria-describedby={undefined}>
      <DialogHeader className="shrink-0 border-b px-5 py-3 pr-12"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="min-h-0 flex-1 overflow-auto bg-muted/20 p-3 sm:p-4">{children}</div>
    </DialogContent>
  </Dialog>
);

export default QuotationPreviewModal;
