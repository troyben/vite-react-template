import React, { useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QuotationPreviewModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }
const PreviewDocument: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [zoom, setZoom] = useState(100);
  return <>
    <DialogHeader className="shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-b px-5 py-2 pr-12"><DialogTitle>{title}</DialogTitle>
      <div role="group" aria-label="Preview zoom controls" className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom(value => Math.max(50, value - 25))}><ZoomOut className="h-4 w-4" /></Button>
        <output aria-label="Preview zoom" aria-live="polite" className="min-w-12 text-center text-xs font-medium tabular-nums">{zoom}%</output>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom in" disabled={zoom >= 200} onClick={() => setZoom(value => Math.min(200, value + 25))}><ZoomIn className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Reset zoom to 100%" title="Reset zoom" disabled={zoom === 100} onClick={() => setZoom(100)}><RotateCcw className="h-3.5 w-3.5" /></Button>
      </div>
    </DialogHeader>
    <div className="min-h-0 flex-1 overflow-auto bg-muted/20 p-3 sm:p-4">
      <div className="mx-auto w-max" style={{ zoom: zoom / 100 }}>{children}</div>
    </div>
  </>;
};

const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({ open, onClose, title = 'Quotation Preview', children }) => (
  <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <DialogContent className="flex h-[95dvh] max-h-[95dvh] w-[95vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[85vw] sm:max-w-none" aria-describedby={undefined}>
      <PreviewDocument key={String(open)} title={title}>{children}</PreviewDocument>
    </DialogContent>
  </Dialog>
);

export default QuotationPreviewModal;
