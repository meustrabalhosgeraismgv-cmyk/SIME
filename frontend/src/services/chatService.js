import api from './api';

export const chatService = {
  getConversas: () => api.get('/chat/conversas'),
  createConversa: (data) => api.post('/chat/conversas', data),
  getConversa: (id) => api.get(`/chat/conversas/${id}`),
  getMensagens: (conversaId, params) => api.get(`/chat/conversas/${conversaId}/mensagens`, { params }),
  enviarMensagem: (conversaId, data) => api.post(`/chat/conversas/${conversaId}/mensagens`, data),
  getUtilizadores: () => api.get('/chat/utilizadores'),
  adicionarParticipante: (conversaId, data) => api.post(`/chat/conversas/${conversaId}/participantes`, data),
  removerParticipante: (conversaId, userId) => api.delete(`/chat/conversas/${conversaId}/participantes/${userId}`),
};
