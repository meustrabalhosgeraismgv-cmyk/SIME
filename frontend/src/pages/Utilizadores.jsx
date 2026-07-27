import { useState, useEffect } from 'react';
import { 
  Users, Search, Trash2, CheckCircle, XCircle, Shield, 
  User, Mail, Phone, Building2, RefreshCw, Filter, AlertTriangle
} from 'lucide-react';
import Loading from '../components/Loading';
import { adminService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const Utilizadores = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const { showToast } = useNotifications();

  useEffect(() => { loadData(); }, [searchQuery, filtroPerfil, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ 
        search: searchQuery, 
        perfil: filtroPerfil, 
        page, 
        limit: 15 
      });
      setUsuarios(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      showToast({ message: 'Erro ao carregar utilizadores', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (id, nome) => {
    try {
      await adminService.aprovarUser(id);
      showToast({ message: `${nome} aprovado com sucesso!`, type: 'success' });
      loadData();
    } catch (error) {
      showToast({ message: 'Erro ao aprovar', type: 'error' });
    }
  };

  const handleRejeitar = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja rejeitar/remover ${nome}?`)) return;
    try {
      await adminService.rejeitarUser(id);
      showToast({ message: `${nome} rejeitado/removido`, type: 'success' });
      loadData();
    } catch (error) {
      showToast({ message: 'Erro ao rejeitar', type: 'error' });
    }
  };

  const handleEliminar = async (id, nome) => {
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja eliminar o utilizador "${nome}"? Esta acção não pode ser desfeita.`)) return;
    try {
      await adminService.deleteUser(id);
      showToast({ message: `${nome} eliminado com sucesso`, type: 'success' });
      loadData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao eliminar utilizador';
      showToast({ message: msg, type: 'error' });
    }
  };

  const getPerfilBadge = (perfil, isGestor) => {
    const styles = {
      admin: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      instituicao: isGestor 
        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
      encarregado: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    };
    const labels = {
      admin: 'Administrador',
      instituicao: isGestor ? 'Gestor' : 'Instituição',
      encarregado: 'Encarregado',
    };
    return (
      <span className={`status-chip text-[10px] ${styles[perfil] || ''}`}>
        {labels[perfil] || perfil}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Gestão de Utilizadores
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerir todos os utilizadores do sistema
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Pesquisar por nome, username ou email..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filtroPerfil}
            onChange={(e) => { setFiltroPerfil(e.target.value); setPage(1); }}
            className="select-field w-full md:w-48"
          >
            <option value="">Todos os perfis</option>
            <option value="admin">Administradores</option>
            <option value="instituicao">Instituições</option>
            <option value="encarregado">Encarregados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading && !usuarios.length ? (
          <Loading text="A carregar utilizadores..." />
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum utilizador encontrado</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Utilizador</th>
                    <th>Nome</th>
                    <th>Perfil</th>
                    <th>Contacto</th>
                    <th>Instituição</th>
                    <th>Estado</th>
                    <th className="text-right">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            user.perfil === 'admin' ? 'bg-purple-100 dark:bg-purple-500/20' :
                            user.perfil === 'instituicao' ? 'bg-blue-100 dark:bg-blue-500/20' :
                            'bg-success-50 dark:bg-success-500/20'
                          }`}>
                            <span className={`font-bold text-sm ${
                              user.perfil === 'admin' ? 'text-purple-600 dark:text-purple-400' :
                              user.perfil === 'instituicao' ? 'text-blue-600 dark:text-blue-400' :
                              'text-success-600 dark:text-success-400'
                            }`}>
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                            {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">{user.nome || '-'}</td>
                      <td>{getPerfilBadge(user.perfil, user.is_gestor)}</td>
                      <td className="text-gray-600 dark:text-gray-400 text-xs">
                        <div className="flex flex-col gap-0.5">
                          {user.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.telefone}</span>}
                          {!user.telefone && user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                          {!user.telefone && !user.email && <span>-</span>}
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400 text-xs">
                        {user.instituicao_nome || '-'}
                      </td>
                      <td>
                        {user.aprovado === 1 ? (
                          <span className="status-chip bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400 text-[10px]">
                            <CheckCircle className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="status-chip bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {user.aprovado === 0 && (
                            <>
                              <button
                                onClick={() => handleAprovar(user.id, user.username)}
                                className="p-2 text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 rounded-lg transition-colors"
                                title="Aprovar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejeitar(user.id, user.username)}
                                className="p-2 text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-500/10 rounded-lg transition-colors"
                                title="Rejeitar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {user.perfil !== 'admin' && (
                            <button
                              onClick={() => handleEliminar(user.id, user.username)}
                              className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-navy-700">
                <p className="text-sm text-gray-500">
                  Página {pagination.page} de {pagination.pages} ({pagination.total} resultados)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Utilizadores;
