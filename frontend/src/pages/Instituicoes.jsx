import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { instituicaoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Instituicoes = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [instituicoes, setInstituicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'ensino_primario',
    endereco: '',
    telefone: '',
    email: '',
    diretor: '',
    municipio_id: '',
    vagas_totais: '',
    status: 'ativa'
  });

  useEffect(() => {
    loadInstituicoes();
  }, [pagination.page]);

  const loadInstituicoes = async () => {
    try {
      setLoading(true);
      const response = await instituicaoService.getAll({
        page: pagination.page,
        limit: 10,
        search
      });
      setInstituicoes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadInstituicoes();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await instituicaoService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Instituição atualizada com sucesso!' });
      } else {
        await instituicaoService.create(formData);
        setAlert({ type: 'success', message: 'Instituição criada com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadInstituicoes();
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao guardar instituição' });
    }
  };

  const handleEdit = (instituicao) => {
    setFormData({
      nome: instituicao.nome,
      tipo: instituicao.tipo,
      endereco: instituicao.endereco || '',
      telefone: instituicao.telefone || '',
      email: instituicao.email || '',
      diretor: instituicao.diretor || '',
      municipio_id: instituicao.municipio_id || '',
      vagas_totais: instituicao.vagas_totais || '',
      status: instituicao.status
    });
    setEditingId(instituicao.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar esta instituição?')) {
      try {
        await instituicaoService.delete(id);
        setAlert({ type: 'success', message: 'Instituição eliminada com sucesso!' });
        loadInstituicoes();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar instituição' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'ensino_primario',
      endereco: '',
      telefone: '',
      email: '',
      diretor: '',
      municipio_id: '',
      vagas_totais: '',
      status: 'ativa'
    });
    setEditingId(null);
  };

  const getVacancyColor = (disponivel, total) => {
    if (!total) return 'bg-gray-400 dark:bg-gray-500';
    const ratio = disponivel / total;
    if (ratio > 0.5) return 'bg-green-500';
    if (ratio > 0.2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const columns = [
    { header: 'Nome', accessor: 'nome', render: (row) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="font-medium text-gray-900 dark:text-white">{row.nome}</span>
      </div>
    )},
    { header: 'Tipo', accessor: 'tipo', render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
        {row.tipo?.replace('_', ' ')}
      </span>
    )},
    { header: 'Município', accessor: 'municipio_nome' },
    { header: 'Diretor', accessor: 'diretor' },
    { header: 'Vagas', accessor: 'vagas_totais', render: (row) => (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${getVacancyColor(row.vagas_disponiveis, row.vagas_totais)}`} />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.vagas_disponiveis} / {row.vagas_totais}
        </span>
      </div>
    )},
    { header: 'Estado', accessor: 'status', render: (row) => (
      <StatusChip status={row.status} />
    )},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/instituicoes/${row.id}`); }}
          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {hasRole('admin', 'ministerio') && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instituições</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de instituições de ensino</p>
        </div>
        {hasRole('admin', 'ministerio') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Instituição
          </button>
        )}
      </div>

      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}

      <form onSubmit={handleSearch}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar instituições por nome, município ou diretor..."
                className="input-field pl-11"
              />
            </div>
            <button type="submit" className="btn-primary">
              Pesquisar
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={instituicoes}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            onRowClick={(row) => navigate(`/instituicoes/${row.id}`)}
          />
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Instituição' : 'Nova Instituição'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome da Instituição *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de Ensino *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="input-field"
                required
              >
                <option value="pre_escolar">Ensino Pré-Escolar</option>
                <option value="ensino_primario">Ensino Primário</option>
                <option value="ensino_medio">Ensino Médio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="em_reforma">Em Reforma</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Diretor
              </label>
              <input
                type="text"
                value={formData.diretor}
                onChange={(e) => setFormData({ ...formData, diretor: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Vagas Totais
              </label>
              <input
                type="number"
                value={formData.vagas_totais}
                onChange={(e) => setFormData({ ...formData, vagas_totais: e.target.value })}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Guardar Alterações' : 'Criar Instituição'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Instituicoes;
