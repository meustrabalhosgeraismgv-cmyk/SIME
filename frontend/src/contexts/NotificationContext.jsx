import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socketClient';

const NotificationContext = createContext(null);

let toastCounter = 0;

const ESTADO_LABEL = {
  pendente: 'Pendente',
  aceite: 'Aceite',
  rejeitada: 'Rejeitada',
  agendado: 'Agendado',
  inscrito: 'Inscrito',
};

const relevantToUser = (user, payload) => {
  if (!user || !payload) return false;
  if (user.perfil === 'admin') return true;
  const eid = user.entidade_id;
  const isGestor = user.perfil === 'instituicao';
  if (isGestor && payload.instituicao_id && payload.instituicao_id === eid) return true;
  if (user.perfil === 'encarregado' && payload.encarregado_id && payload.encarregado_id === eid) return true;
  return false;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const handlersRef = useRef({});

  const addNotification = useCallback(({ title, message, type = 'info', duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const newNotification = { id, title, message, type, read: false, created_at: new Date() };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
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

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  // Global socket listeners: connect once per authenticated user and react to real-time events.
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('sime_token');
    if (!token) return;

    const socket = connectSocket(token);

    const register = (evento, handler) => {
      handlersRef.current[evento] = handler;
      socket?.on(evento, handler);
    };

    const onSolicitacaoNovo = (p) => {
      if (!relevantToUser(user, p)) return;
      const isGestor = user.perfil === 'instituicao' || user.perfil === 'admin';
      const msg = isGestor
        ? `Nova solicitação de vaga para "${p.aluno_nome}" recebida.`
        : `Sua solicitação para "${p.aluno_nome}" foi criada.`;
      addNotification({ title: 'Solicitação de vaga', message: msg, type: 'info' });
      showToast({ message: msg, type: 'info' });
    };

    const onSolicitacaoUpdate = (p) => {
      if (!relevantToUser(user, p)) return;
      const isGestor = user.perfil === 'instituicao' || user.perfil === 'admin';
      const estado = ESTADO_LABEL[p.estado] || p.estado;
      const msg = isGestor
        ? `Solicitação de "${p.aluno_nome}" mudou para ${estado}.`
        : `A sua solicitação para "${p.aluno_nome}" mudou para ${estado}.`;
      addNotification({ title: 'Solicitação atualizada', message: msg, type: p.estado === 'rejeitada' ? 'erro' : 'sucesso' });
      showToast({ message: msg, type: p.estado === 'rejeitada' ? 'error' : 'success' });
    };

    const onComunicado = (p) => {
      if (!relevantToUser(user, p)) return;
      const msg = p?.titulo || 'Novo comunicado recebido.';
      addNotification({ title: 'Comunicado', message: msg, type: 'info' });
      showToast({ message: msg, type: 'info' });
    };

    const onAviso = (p) => {
      if (!relevantToUser(user, p)) return;
      const msg = p?.titulo || 'Novo aviso recebido.';
      addNotification({ title: 'Aviso', message: msg, type: 'aviso' });
      showToast({ message: msg, type: 'warning' });
    };

    const onPagamento = (p) => {
      if (user.perfil !== 'encarregado') return;
      const msg = p?.valor
        ? `Pagamento de ${Number(p.valor).toLocaleString('pt-AO')} Kz confirmado.`
        : 'Pagamento confirmado com sucesso.';
      addNotification({ title: 'Pagamento confirmado', message: msg, type: 'sucesso' });
      showToast({ message: msg, type: 'success' });
    };

    const onMatricula = (p) => {
      const isGestor = user.perfil === 'instituicao' || user.perfil === 'admin';
      if (user.perfil === 'instituicao' && p?.instituicao_id && p.instituicao_id !== user.entidade_id) return;
      const msg = `Nova matrícula de "${p.aluno_nome}" registada.`;
      addNotification({ title: 'Matrícula', message: msg, type: 'sucesso' });
      showToast({ message: msg, type: 'success' });
    };

    const onNewMessage = (msg) => {
      if (!msg || msg.remetente_id === user.id) return;
      const sender = msg.remetente_nome || msg.remetente_username || 'Alguém';
      const preview = typeof msg.conteudo === 'string' && msg.conteudo.length > 80
        ? msg.conteudo.slice(0, 80) + '…'
        : msg.conteudo;
      addNotification({ title: `Nova mensagem de ${sender}`, message: preview, type: 'info' });
      showToast({ message: `📩 ${sender}: ${preview}`, type: 'info' });
    };

    register('solicitacao:novo', onSolicitacaoNovo);
    register('solicitacao:update', onSolicitacaoUpdate);
    register('comunicado:novo', onComunicado);
    register('aviso:novo', onAviso);
    register('pagamento:confirmado', onPagamento);
    register('matricula:novo', onMatricula);
    register('new-message', onNewMessage);

    return () => {
      Object.entries(handlersRef.current).forEach(([evento, handler]) => {
        socket?.off(evento, handler);
      });
      handlersRef.current = {};
    };
  }, [user?.id, user?.perfil, user?.entidade_id, addNotification, showToast]);

  // Disconnect the socket when the user logs out.
  useEffect(() => {
    if (!user?.id) disconnectSocket();
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, removeNotification, markAsRead, markAllAsRead, clearAll,
      toasts, showToast, dismissToast
    }}>
      {children}
      {toasts.length > 0 && <ToastStack toasts={toasts} onClose={dismissToast} />}
    </NotificationContext.Provider>
  );
};

const ToastStack = ({ toasts, onClose }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
    {toasts.map(t => (
      <Toast key={t.id} message={t.message} type={t.type} onClose={() => onClose(t.id)} />
    ))}
  </div>
);

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
    <div className={`${colors[type]} text-white px-4 py-3 rounded-xl shadow-float flex items-start gap-3 min-w-[300px] animate-slide-down pointer-events-auto`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="text-sm font-medium flex-1 break-words">{message}</span>
      <button onClick={onClose} className="hover:opacity-75 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
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