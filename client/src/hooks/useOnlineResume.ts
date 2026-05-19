import { useEffect } from 'react';
import { useUploadStore } from '@/stores/uploadStore';

export function useOnlineResume(retry: (id: string) => void) {
  useEffect(() => {
    const onOnline = () => {
      const { items } = useUploadStore.getState();
      for (const id in items) {
        const it = items[id];
        if (it.status === 'failed' && (it.error?.code === 'offline' || it.error?.code === 'network')) {
          retry(id);
        }
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [retry]);
}
