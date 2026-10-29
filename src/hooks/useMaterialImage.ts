import { useEffect, useRef, useState } from 'react';
import { compressMaterialImage } from '@/services/materialImageService';

export function useMaterialImage(initialImage: string | null = null) {
  const [image, setImage] = useState<string | null>(initialImage);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const select = async (file: File) => {
    request.current?.abort();
    const current = new AbortController();
    request.current = current;
    setProcessing(true); setError('');
    try {
      const data = await compressMaterialImage(file, current.signal);
      if (!current.signal.aborted) setImage(data);
    } catch (err) {
      if (!current.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to prepare this image. Choose another image.');
    } finally { if (!current.signal.aborted) setProcessing(false); }
  };
  const remove = () => {
    request.current?.abort(); setProcessing(false); setImage(null); setError('');
  };
  return { image, processing, error, select, remove };
}
