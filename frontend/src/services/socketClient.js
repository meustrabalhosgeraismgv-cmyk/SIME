import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = window.location.hostname === 'localhost'
  ? `http://${window.location.hostname}:3001`
  : window.location.origin;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Erro de conexão:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

export function joinConversa(conversaId) {
  socket?.emit('join-conversa', conversaId);
}

export function leaveConversa(conversaId) {
  socket?.emit('leave-conversa', conversaId);
}

export function sendMessage(data, callback) {
  socket?.emit('send-message', data, callback);
}

export function emitTyping(conversaId) {
  socket?.emit('typing', conversaId);
}

export function emitStopTyping(conversaId) {
  socket?.emit('stop-typing', conversaId);
}

export function markRead(conversaId) {
  socket?.emit('mark-read', conversaId);
}

export function onNewMessage(callback) {
  socket?.on('new-message', callback);
  return () => socket?.off('new-message', callback);
}

export function onUserTyping(callback) {
  socket?.on('user-typing', callback);
  return () => socket?.off('user-typing', callback);
}

export function onUserStopTyping(callback) {
  socket?.on('user-stop-typing', callback);
  return () => socket?.off('user-stop-typing', callback);
}

export function onOnlineUsers(callback) {
  socket?.on('online-users', callback);
  return () => socket?.off('online-users', callback);
}

export function onMessageRead(callback) {
  socket?.on('message-read', callback);
  return () => socket?.off('message-read', callback);
}

export function onMemberAdded(callback) {
  socket?.on('member-added', callback);
  return () => socket?.off('member-added', callback);
}
