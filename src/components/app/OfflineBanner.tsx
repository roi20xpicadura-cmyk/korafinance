import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--color-danger-solid)', color: 'white',
      padding: '8px 16px', fontSize: 13, fontWeight: 600,
    }}>
      <WifiOff style={{ width: 14, height: 14 }} />
      Sem conexão com a internet. Suas alterações serão salvas quando reconectar.
    </div>
  );
}
