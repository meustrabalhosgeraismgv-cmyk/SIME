import { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, Search, Filter, Building2, 
  User, Mail, Phone, AlertTriangle, Shield, RefreshCw
} from 'lucide-react';
import Loading from '../components/Loading';
import { adminService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const Aprovacoes = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [stats, setStats] = useState(null);
  const { showToast } = useNotifications();

  useEffect(() => { loadData(); }, [searchQuery, filtroPerfil]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        adminService.getUsers({ search: searchQuery, perfil: filtroPerfil, limit: 50 }),
        adminService.getStats()
      ]);
      setUsuarios(usersRes.data.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast({ message: 'Erro ao carregar dados', type: 'error' });
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
      showToast({ message: 'Erro ao aprovar utilizador', type: 'error' });
    }
  };

  const handleRejeitar = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja rejeitar ${nome}?`)) return;
    try {
      await adminService.rejeitarUser(id);
      showToast({ message: `${nome} rejeitado`, type: 'success' });
      loadData();
    } catch (error) {
      showToast({ message: 'Erro ao rejeitar utilizador', type: 'error' });
    }
  };

  const pendentes = usuarios.filter(u => !u.aprovado);
  const aprovados = usuarios.filter(u => u.aprovado);

  if (loading && !usuarios.length) return <Loading text="A carregar aprovações..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-500" />
            Aprovações do Sistema
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Revise e aprove pedidos de registo de instituições e encarregados
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-warning-50 dark:bg-warning-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendentes_aprovacao}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-success-50 dark:bg-success-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_utilizadores}</p>
              <p className="text-sm text-gray-500">Total Utilizadores</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
              <Building2 className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_instituicoes}</p>
              <p className="text-sm text-gray-500">Instituições</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, username ou email..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filtroPerfil}
            onChange={(e) => setFiltroPerfil(e.target.value)}
            className="select-field w-full md:w-48"
          >
            <option value="">Todos os perfis</option>
            <option value="instituicao">Instituições</option>
            <option value="encarregado">Encarregados</option>
          </select>
        </div>
      </div>

      {/* Pendentes Section */}
      {pendentes.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-500" />
            Pendentes de Aprovação ({pendentes.length})
          </h3>
          <div className="space-y-3">
            {pendentes.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-warning-50/50 dark:bg-warning-500/5 border border-warning-200 dark:border-warning-500/20 rounded-xl">
                <div className="w-12 h-12 bg-warning-100 dark:bg-warning-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
                    <span className={`status-chip text-[10px] ${
                      user.perfil === 'instituicao' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                      'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                    }`}>
                      {user.perfil === 'instituicao' ? 'Instituição' : 'Encarregado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.nome || 'Sem nome'}</p>
                  {user.instituicao_nome && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" /> {user.instituicao_nome}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                    {user.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.telefone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAprovar(user.id, user.username)}
                    className="btn-success text-xs px-3 py-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleRejeitar(user.id, user.username)}
                    className="btn-error text-xs px-3 py-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          Todos os Utilizadores ({aprovados.length} aprovados)
        </h3>
        {aprovados.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum utilizador aprovado encontrado</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Nome</th>
                  <th>Perfil</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {aprovados.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
                      </div>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{user.nome || '-'}</td>
                    <td>
                      <span className={`status-chip ${
                        user.perfil === 'admin' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                        user.perfil === 'instituicao' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                        'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                      }`}>
                        {user.perfil === 'admin' ? 'Admin' : user.perfil === 'instituicao' ? 'Instituição' : 'Encarregado'}
                      </span>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400 text-xs">
                      {user.email || user.telefone || '-'}
                    </td>
                    <td>
                      <span className="status-chip bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Aprovacoes;
