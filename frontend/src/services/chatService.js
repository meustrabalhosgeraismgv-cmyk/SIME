import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '';

const API_ORIGIN = API_BASE.replace(/\/+$/, '').replace(/\/api$/i, '');

export const chatService = {
  getConversas: () => api.get('/chat/conversas'),
  createConversa: (data) => api.post('/chat/conversas', data),
  getConversa: (id) => api.get(`/chat/conversas/${id}`),
  getMensagens: (conversaId, params) => api.get(`/chat/conversas/${conversaId}/mensagens`, { params }),
  enviarMensagem: (conversaId, data) => api.post(`/chat/conversas/${conversaId}/mensagens`, data),
  getUtilizadores: () => api.get('/chat/utilizadores'),
  adicionarParticipante: (conversaId, data) => api.post(`/chat/conversas/${conversaId}/participantes`, data),
  removerParticipante: (conversaId, userId) => api.delete(`/chat/conversas/${conversaId}/participantes/${userId}`),
  uploadFicheiro: (file) => {
    const formData = new FormData();
    formData.append('ficheiro', file);
    return api.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  urlFicheiro: (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return API_ORIGIN + url;
  },
};
