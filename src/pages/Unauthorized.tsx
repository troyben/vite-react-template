import React from 'react';
import '../styles/Unauthorized.css';

const Unauthorized: React.FC = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="32" fill="var(--status-pending-bg)"/>
          <path d="M20 44L44 20M20 20l24 24" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round"/>
        </svg>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <a href="/" className="unauthorized-link">Go Home</a>
      </div>
    </div>
  );
};

export default Unauthorized;
