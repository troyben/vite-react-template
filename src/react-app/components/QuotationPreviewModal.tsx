import React from 'react';
import '../styles/QuotationForm.css';

const QuotationPreviewModal = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay preview-modal">
      <div className="modal-content preview-modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default QuotationPreviewModal;
