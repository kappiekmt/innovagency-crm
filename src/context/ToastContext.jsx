import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const colors = {
            success: { bg: 'rgba(20,83,45,0.95)', border: '#22C55E33', icon: '#22C55E', Ic: CheckCircle },
            error:   { bg: 'rgba(127,29,29,0.95)', border: '#EF444433', icon: '#EF4444', Ic: XCircle },
            info:    { bg: 'rgba(30,58,138,0.95)', border: '#3B82F633', icon: '#3B82F6', Ic: AlertCircle },
          }[t.type] ?? {};
          const { bg, border, icon, Ic } = colors;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10,
              background: bg, border: `1px solid ${border}`,
              color: '#F4F4F5', fontSize: 13, fontWeight: 500,
              minWidth: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              pointerEvents: 'auto',
            }}>
              {Ic && <Ic size={15} color={icon} />}
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
