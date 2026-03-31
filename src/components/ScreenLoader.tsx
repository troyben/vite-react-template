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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}
