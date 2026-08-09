import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sime_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sime_token');
      localStorage.removeItem('sime_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getPerfil: () => api.get('/auth/perfil'),
  getPerfilCompleto: () => api.get('/auth/perfil-completo'),
  updatePerfil: (data) => api.put('/auth/perfil', data),
  uploadFoto: (file) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api.post('/auth/upload-foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getProvincia: () => api.get('/dashboard/provincia'),
  getOcupacao: (instituicaoId) => api.get('/dashboard/ocupacao', { params: { instituicao_id: instituicaoId } })
};

export const instituicaoService = {
  getAll: (params) => api.get('/instituicoes', { params }),
  getById: (id) => api.get(`/instituicoes/${id}`),
  create: (data) => api.post('/instituicoes', data),
  update: (id, data) => api.put(`/instituicoes/${id}`, data),
  delete: (id) => api.delete(`/instituicoes/${id}`),
  getEstatisticas: (id) => api.get(`/instituicoes/${id}/estatisticas`),
  getStats: () => api.get('/instituicoes/stats')
};

export const alunoService = {
  getAll: (params) => api.get('/alunos', { params }),
  getById: (id) => api.get(`/alunos/${id}`),
  create: (data) => api.post('/alunos', data),
  update: (id, data) => api.put(`/alunos/${id}`, data),
  delete: (id) => api.delete(`/alunos/${id}`)
};

export const professorService = {
  getAll: (params) => api.get('/professores', { params }),
  getById: (id) => api.get(`/professores/${id}`),
  create: (data) => api.post('/professores', data),
  update: (id, data) => api.put(`/professores/${id}`, data),
  delete: (id) => api.delete(`/professores/${id}`)
};

export const turmaService = {
  getAll: (params) => api.get('/turmas', { params }),
  getById: (id) => api.get(`/turmas/${id}`),
  create: (data) => api.post('/turmas', data),
  update: (id, data) => api.put(`/turmas/${id}`, data),
  delete: (id) => api.delete(`/turmas/${id}`)
};

export const matriculaService = {
  getAll: (params) => api.get('/matriculas', { params }),
  create: (data) => api.post('/matriculas', data),
  cancel: (id) => api.put(`/matriculas/${id}/cancelar`)
};

export const encarregadoService = {
  getAll: (params) => api.get('/encarregados', { params }),
  getById: (id) => api.get(`/encarregados/${id}`),
  create: (data) => api.post('/encarregados', data),
  update: (id, data) => api.put(`/encarregados/${id}`, data),
  delete: (id) => api.delete(`/encarregados/${id}`)
};

export const noticiaService = {
  getAll: (params) => api.get('/noticias', { params }),
  getDestaque: () => api.get('/noticias/destaque'),
  getById: (id) => api.get(`/noticias/${id}`),
  create: (data) => api.post('/noticias', data),
  update: (id, data) => api.put(`/noticias/${id}`, data),
  delete: (id) => api.delete(`/noticias/${id}`),
};

export const comunicadoService = {
  getAll: (params) => api.get('/comunicados', { params }),
  getGestor: () => api.get('/comunicados/gestor'),
  create: (data) => api.post('/comunicados', data),
  update: (id, data) => api.put(`/comunicados/${id}`, data),
  delete: (id) => api.delete(`/comunicados/${id}`),
};

export const solicitacaoService = {
  getGestor: () => api.get('/solicitacoes/gestor'),
  getEncarregado: () => api.get('/solicitacoes/encarregado'),
  create: (data) => api.post('/solicitacoes', data),
  aceitar: (id) => api.put(`/solicitacoes/${id}/aceitar`),
  rejeitar: (id, data) => api.put(`/solicitacoes/${id}/rejeitar`, data),
  agendar: (id, data) => api.put(`/solicitacoes/${id}/agendar`, data),
  inscrever: (id) => api.put(`/solicitacoes/${id}/inscrever`),
};

export const pagamentoService = {
  getGestor: () => api.get('/pagamentos/gestor'),
  getEncarregado: () => api.get('/pagamentos/encarregado'),
  confirmar: (id) => api.put(`/pagamentos/${id}/confirmar`),
  cancelar: (id) => api.put(`/pagamentos/${id}/cancelar`),
};

export const calendarService = {
  getAll: (params) => api.get('/calendario', { params }),
  getById: (id) => api.get(`/calendario/${id}`),
  create: (data) => api.post('/calendario', data),
  update: (id, data) => api.put(`/calendario/${id}`, data),
  delete: (id) => api.delete(`/calendario/${id}`)
};

export const cursoService = {
  getByInstituicao: (instituicaoId) => api.get(`/cursos/${instituicaoId}`),
  create: (instituicaoId, data) => api.post(`/cursos/${instituicaoId}`, data),
  update: (id, data) => api.put(`/cursos/${id}`, data),
  delete: (id) => api.delete(`/cursos/${id}`),
};

export const informacoesService = {
  getByInstituicao: (instituicaoId) => api.get(`/informacoes/${instituicaoId}`),
  update: (instituicaoId, data) => api.put(`/informacoes/${instituicaoId}`, data),
};

export const taxaReservaService = {
  calcular: (params) => api.get('/taxa-reserva/calcular', { params }),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  aprovarUser: (id) => api.put(`/admin/users/${id}/aprovar`),
  rejeitarUser: (id) => api.put(`/admin/users/${id}/rejeitar`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const relatorioService = {
  getSintese: (params) => api.get('/relatorios/sintese', { params }),
};

export const documentoService = {
  getAll: (params) => api.get('/documentos', { params }),
  getCategorias: () => api.get('/documentos/categorias'),
  getById: (id) => api.get(`/documentos/${id}`),
  create: (data) => api.post('/documentos', data),
  update: (id, data) => api.put(`/documentos/${id}`, data),
  delete: (id) => api.delete(`/documentos/${id}`),
};

export const smsService = {
  getAll: (params) => api.get('/sms', { params }),
  getStats: () => api.get('/sms/stats'),
  getDestinatarios: () => api.get('/sms/destinatarios'),
  enviar: (data) => api.post('/sms/enviar', data),
  emMassa: (data) => api.post('/sms/em-massa', data),
};

export const rhService = {
  getAll: (params) => api.get('/rh', { params }),
  getById: (id) => api.get(`/rh/${id}`),
  getStats: () => api.get('/rh/stats'),
  create: (data) => api.post('/rh', data),
  update: (id, data) => api.put(`/rh/${id}`, data),
  delete: (id) => api.delete(`/rh/${id}`),
  getAvaliacoes: (params) => api.get('/rh/avaliacoes', { params }),
  createAvaliacao: (data) => api.post('/rh/avaliacoes', data),
  updateAvaliacao: (id, data) => api.put(`/rh/avaliacoes/${id}`, data),
  deleteAvaliacao: (id) => api.delete(`/rh/avaliacoes/${id}`),
};

export const classificacaoService = {
  getAll: (params) => api.get('/classificacoes', { params }),
  getHistorico: (alunoId) => api.get(`/classificacoes/historico/${alunoId}`),
  create: (data) => api.post('/classificacoes', data),
  update: (id, data) => api.put(`/classificacoes/${id}`, data),
  delete: (id) => api.delete(`/classificacoes/${id}`),
};

export const denunciaService = {
  getAll: (params) => api.get('/denuncias', { params }),
  getById: (id) => api.get(`/denuncias/${id}`),
  getStats: () => api.get('/denuncias/stats'),
  create: (data) => api.post('/denuncias', data),
  update: (id, data) => api.put(`/denuncias/${id}`, data),
  delete: (id) => api.delete(`/denuncias/${id}`),
};

export default api;