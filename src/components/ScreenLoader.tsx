import { useState, useCallback } from 'react';

/**
 * useScreenLoader - React hook to manage a global screen loader state.
 * Returns: [isLoading, showLoader, hideLoader]
 */
export function useScreenLoader() {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);

  return [isLoading, showLoader, hideLoader] as const;
}

/**
 * ScreenLoader - A simple fullscreen loader overlay component.
 */
export function ScreenLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      color: '#333',
      transition: 'opacity 0.2s',
    }}>
      <div className="loader-spinner" style={{
        border: '8px solid #f3f3f3',
        borderTop: '8px solid #3498db',
        borderRadius: '50%',
        width: 60,
        height: 60,
        animation: 'spin 1s linear infinite',
        marginRight: 20
      }} />
      Loading...
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
