import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { professorService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Professores = () => {
  const { user, hasRole } = useAuth();
  const isGestor = user?.perfil === 'instituicao';
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    bi: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    formacao: '',
    especialidade: '',
    numero_funcionario: '',
    instituicao_id: isGestor ? user?.entidade_id : '',
    estado: 'ativo'
  });

  useEffect(() => {
    loadProfessores();
  }, [pagination.page]);

  const loadProfessores = async () => {
    try {
      setLoading(true);
      const response = await professorService.getAll({
        page: pagination.page,
        limit: 10,
        search
      });
      setProfessores(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProfessores();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await professorService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Professor atualizado com sucesso!' });
      } else {
        await professorService.create(formData);
        setAlert({ type: 'success', message: 'Professor registado com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadProfessores();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar professor' });
    }
  };

  const handleEdit = (professor) => {
    setFormData({
      nome_completo: professor.nome_completo,
      bi: professor.bi,
      data_nascimento: professor.data_nascimento || '',
      telefone: professor.telefone || '',
      email: professor.email || '',
      formacao: professor.formacao || '',
      especialidade: professor.especialidade || '',
      numero_funcionario: professor.numero_funcionario,
      instituicao_id: isGestor ? user?.entidade_id : (professor.instituicao_id || ''),
      estado: professor.estado
    });
    setEditingId(professor.id);
    setShowModal(true);
  };

  const handleView = async (professor) => {
    try {
      const response = await professorService.getById(professor.id);
      setSelectedProfessor(response.data);
    } catch (error) {
      console.error('Erro ao carregar professor:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar este professor?')) {
      try {
        await professorService.delete(id);
        setAlert({ type: 'success', message: 'Professor eliminado com sucesso!' });
        loadProfessores();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar professor' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      bi: '',
      data_nascimento: '',
      telefone: '',
      email: '',
      formacao: '',
      especialidade: '',
      numero_funcionario: '',
      instituicao_id: isGestor ? user?.entidade_id : '',
      estado: 'ativo'
    });
    setEditingId(null);
  };

  const columns = [
    { header: 'Nome', accessor: 'nome_completo', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.nome_completo}</span>
    )},
    { header: 'Nº Funcionário', accessor: 'numero_funcionario' },
    { header: 'Especialidade', accessor: 'especialidade' },
    { header: 'Instituição', accessor: 'instituicao_nome' },
    { header: 'Telefone', accessor: 'telefone' },
    { header: 'Estado', accessor: 'estado', render: (row) => (
      <StatusChip status={row.estado} />
    )},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleView(row); }}
          className="p-2 hover:bg-primary/10 rounded-lg text-primary dark:text-primary-light dark:hover:bg-primary/20"
        >
          <Eye className="w-4 h-4" />
        </button>
        {hasRole('admin', 'instituicao') && (
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Professores</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de professores</p>
        </div>
        {hasRole('admin', 'instituicao') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Professor
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
              placeholder="Pesquisar por nome ou número de funcionário..."
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
          data={professores}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onRowClick={(row) => handleView(row)}
        />
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Professor' : 'Novo Professor'}
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
                Número de Funcionário *
              </label>
              <input
                type="text"
                value={formData.numero_funcionario}
                onChange={(e) => setFormData({ ...formData, numero_funcionario: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                Formação
              </label>
              <input
                type="text"
                value={formData.formacao}
                onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.especialidade}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instituição *
              </label>
              {isGestor ? (
                <input
                  type="text"
                  value={user?.instituicao_nome || user?.entidade_id || formData.instituicao_id}
                  className="input-field opacity-70"
                  readOnly
                />
              ) : (
                <input
                  type="text"
                  value={formData.instituicao_id}
                  onChange={(e) => setFormData({ ...formData, instituicao_id: e.target.value })}
                  className="input-field"
                  placeholder="ID da instituição"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="input-field"
              >
                <option value="ativo">Ativo</option>
                <option value="afastado">Afastado</option>
                <option value="aposentado">Aposentado</option>
              </select>
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
              {editingId ? 'Guardar Alterações' : 'Registar Professor'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!selectedProfessor} 
        onClose={() => setSelectedProfessor(null)}
        title="Detalhes do Professor"
        size="lg"
      >
        {selectedProfessor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.nome_completo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">BI</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.bi}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Número de Funcionário</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.numero_funcionario}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data de Nascimento</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProfessor.data_nascimento 
                    ? new Date(selectedProfessor.data_nascimento).toLocaleDateString('pt-BR')
                    : 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.telefone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.email || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Formação</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.formacao || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Especialidade</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.especialidade || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instituição</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProfessor.instituicao_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                <StatusChip status={selectedProfessor.estado} />
              </div>
            </div>

            {selectedProfessor.turmas?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Turmas</h4>
                <div className="space-y-2">
                  {selectedProfessor.turmas.map((turma, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{turma.nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{turma.ano_letivo} - {turma.nivel}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{turma.vagas_ocupadas}/{turma.vagas} alunos</span>
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

export default Professores;
