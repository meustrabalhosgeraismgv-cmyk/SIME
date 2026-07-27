import { createContext, useContext, useState, useCallback } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const addNotification = useCallback(({ title, message, type = 'info', duration = 5000 }) => {
    const id = Date.now();
    const newNotification = { id, title, message, type, read: false, created_at: new Date() };
    setNotifications(prev => [newNotification, ...prev]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    setToast({ message, type, duration });
    setTimeout(() => setToast(null), duration);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, removeNotification, markAsRead, markAllAsRead, clearAll,
      toast, showToast
    }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </NotificationContext.Provider>
  );
};

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const colors = {
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
    info: 'bg-primary-500',
  };
  const Icon = icons[type] || Info;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className={`${colors[type]} text-white px-5 py-3 rounded-xl shadow-float flex items-center gap-3 min-w-[300px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="hover:opacity-75">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
