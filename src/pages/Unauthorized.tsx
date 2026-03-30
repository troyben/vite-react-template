import React from 'react';
import { Ban } from 'lucide-react';
import '../styles/Unauthorized.css';

const Unauthorized: React.FC = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <Ban className="w-16 h-16" style={{ color: 'var(--primary-color)' }} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <a href="/" className="unauthorized-link">Go Home</a>
      </div>
    </div>
  );
};

export default Unauthorized;
