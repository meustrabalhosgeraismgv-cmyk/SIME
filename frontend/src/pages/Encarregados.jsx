import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { encarregadoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Encarregados = () => {
  const { hasRole } = useAuth();
  const [encarregados, setEncarregados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEncarregado, setSelectedEncarregado] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    bi: '',
    telefone: '',
    email: '',
    endereco: '',
    profissao: ''
  });

  useEffect(() => {
    loadEncarregados();
  }, [pagination.page]);

  const loadEncarregados = async () => {
    try {
      setLoading(true);
      const response = await encarregadoService.getAll({
        page: pagination.page,
        limit: 10,
        search
      });
      setEncarregados(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar encarregados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadEncarregados();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await encarregadoService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Encarregado atualizado com sucesso!' });
      } else {
        await encarregadoService.create(formData);
        setAlert({ type: 'success', message: 'Encarregado registado com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadEncarregados();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar encarregado' });
    }
  };

  const handleEdit = (encarregado) => {
    setFormData({
      nome_completo: encarregado.nome_completo,
      bi: encarregado.bi,
      telefone: encarregado.telefone,
      email: encarregado.email || '',
      endereco: encarregado.endereco || '',
      profissao: encarregado.profissao || ''
    });
    setEditingId(encarregado.id);
    setShowModal(true);
  };

  const handleView = async (encarregado) => {
    try {
      const response = await encarregadoService.getById(encarregado.id);
      setSelectedEncarregado(response.data);
    } catch (error) {
      console.error('Erro ao carregar encarregado:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar este encarregado?')) {
      try {
        await encarregadoService.delete(id);
        setAlert({ type: 'success', message: 'Encarregado eliminado com sucesso!' });
        loadEncarregados();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar encarregado' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      bi: '',
      telefone: '',
      email: '',
      endereco: '',
      profissao: ''
    });
    setEditingId(null);
  };

  const columns = [
    { header: 'Nome', accessor: 'nome_completo', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.nome_completo}</span>
    )},
    { header: 'BI', accessor: 'bi' },
    { header: 'Telefone', accessor: 'telefone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Profissão', accessor: 'profissao' },
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleView(row); }}
          className="p-2 hover:bg-primary/10 rounded-lg text-primary dark:text-primary-light dark:hover:bg-primary/20"
        >
          <Eye className="w-4 h-4" />
        </button>
        {hasRole('admin', 'diretor') && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              className="p-2 hover:bg-warning/10 rounded-lg text-warning dark:text-warning-light dark:hover:bg-warning/20"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
              className="p-2 hover:bg-error/10 rounded-lg text-error dark:text-error-light dark:hover:bg-error/20"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Encarregados</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de encarregados de educação</p>
        </div>
        {hasRole('admin', 'diretor') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Encarregado
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

      <form onSubmit={handleSearch} className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, BI ou telefone..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Pesquisar
          </button>
        </div>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={encarregados}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onRowClick={(row) => handleView(row)}
        />
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Encarregado' : 'Novo Encarregado'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                BI *
              </label>
              <input
                type="text"
                value={formData.bi}
                onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone *
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profissão
              </label>
              <input
                type="text"
                value={formData.profissao}
                onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="input-field"
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
              {editingId ? 'Guardar Alterações' : 'Registar Encarregado'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!selectedEncarregado} 
        onClose={() => setSelectedEncarregado(null)}
        title="Detalhes do Encarregado"
        size="lg"
      >
        {selectedEncarregado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.nome_completo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">BI</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.bi}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.telefone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.email || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profissão</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.profissao || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEncarregado.endereco || 'Não informado'}</p>
              </div>
            </div>

            {selectedEncarregado.alunos?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Alunos</h4>
                <div className="space-y-2">
                  {selectedEncarregado.alunos.map((aluno, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{aluno.nome_completo}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{aluno.numero_estudante}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{aluno.instituicao_nome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Encarregados;
