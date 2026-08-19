import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { turmaService, professorService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Turmas = () => {
  const { user, hasRole } = useAuth();
  const isGestor = user?.perfil === 'instituicao';
  const [turmas, setTurmas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    ano_letivo: new Date().getFullYear(),
    nivel: '1a_classe',
    instituicao_id: isGestor ? user?.entidade_id : '',
    professor_titular_id: '',
    vagas: 40
  });

  useEffect(() => {
    loadTurmas();
  }, [pagination.page]);

  useEffect(() => {
    if (isGestor && user?.entidade_id) {
      professorService.getAll({ instituicao_id: user.entidade_id, limit: 100 })
        .then(res => setProfessores(res.data.data))
        .catch(() => setProfessores([]));
    }
  }, []);

  const loadTurmas = async () => {
    try {
      setLoading(true);
      const response = await turmaService.getAll({
        page: pagination.page,
        limit: 10,
        search
      });
      setTurmas(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadTurmas();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await turmaService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Turma atualizada com sucesso!' });
      } else {
        await turmaService.create(formData);
        setAlert({ type: 'success', message: 'Turma criada com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadTurmas();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar turma' });
    }
  };

  const handleEdit = (turma) => {
    setFormData({
      nome: turma.nome,
      ano_letivo: turma.ano_letivo,
      nivel: turma.nivel,
      instituicao_id: isGestor ? user?.entidade_id : (turma.instituicao_id || ''),
      professor_titular_id: turma.professor_titular_id || '',
      vagas: turma.vagas
    });
    setEditingId(turma.id);
    setShowModal(true);
  };

  const handleView = async (turma) => {
    try {
      const response = await turmaService.getById(turma.id);
      setSelectedTurma(response.data);
    } catch (error) {
      console.error('Erro ao carregar turma:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar esta turma?')) {
      try {
        await turmaService.delete(id);
        setAlert({ type: 'success', message: 'Turma eliminada com sucesso!' });
        loadTurmas();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar turma' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      ano_letivo: new Date().getFullYear(),
      nivel: '1a_classe',
      instituicao_id: isGestor ? user?.entidade_id : '',
      professor_titular_id: '',
      vagas: 40
    });
    setEditingId(null);
  };

  const getNivelLabel = (nivel) => {
    const labels = {
      '1a_classe': '1ª Classe',
      '2a_classe': '2ª Classe',
      '3a_classe': '3ª Classe',
      '4a_classe': '4ª Classe',
      '5a_classe': '5ª Classe',
      '6a_classe': '6ª Classe',
      '7a_classe': '7ª Classe',
      '8a_classe': '8ª Classe',
      '9a_classe': '9ª Classe',
      '10a_classe': '10ª Classe',
      '11a_classe': '11ª Classe',
      '12a_classe': '12ª Classe'
    };
    return labels[nivel] || nivel;
  };

  const columns = [
    { header: 'Nome', accessor: 'nome', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.nome}</span>
    )},
    { header: 'Ano Letivo', accessor: 'ano_letivo' },
    { header: 'Nível', accessor: 'nivel', render: (row) => (
      <span>{getNivelLabel(row.nivel)}</span>
    )},
    { header: 'Instituição', accessor: 'instituicao_nome' },
    { header: 'Professor', accessor: 'professor_nome' },
    { header: 'Vagas', accessor: 'vagas', render: (row) => (
      <span>{row.vagas_ocupadas}/{row.vagas}</span>
    )},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleView(row); }}
          className="p-2 hover:bg-primary/10 rounded-lg text-primary dark:text-primary-light dark:hover:bg-primary/20"
        >
          <Eye className="w-4 h-4" />
        </button>
        {hasRole('admin', 'diretor', 'instituicao') && (
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Turmas</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de turmas</p>
        </div>
        {hasRole('admin', 'diretor', 'instituicao') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Turma
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
              placeholder="Pesquisar turmas..."
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
          data={turmas}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onRowClick={(row) => handleView(row)}
        />
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Turma' : 'Nova Turma'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Turma *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="input-field"
                placeholder="Ex: 10ª Classe A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ano Letivo *
              </label>
              <input
                type="number"
                value={formData.ano_letivo}
                onChange={(e) => setFormData({ ...formData, ano_letivo: e.target.value })}
                className="input-field"
                min="2020"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nível *
              </label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                className="input-field"
                required
              >
                <option value="1a_classe">1ª Classe</option>
                <option value="2a_classe">2ª Classe</option>
                <option value="3a_classe">3ª Classe</option>
                <option value="4a_classe">4ª Classe</option>
                <option value="5a_classe">5ª Classe</option>
                <option value="6a_classe">6ª Classe</option>
                <option value="7a_classe">7ª Classe</option>
                <option value="8a_classe">8ª Classe</option>
                <option value="9a_classe">9ª Classe</option>
                <option value="10a_classe">10ª Classe</option>
                <option value="11a_classe">11ª Classe</option>
                <option value="12a_classe">12ª Classe</option>
              </select>
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
                Professor Titular
              </label>
              {isGestor ? (
                <select
                  value={formData.professor_titular_id}
                  onChange={(e) => setFormData({ ...formData, professor_titular_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sem professor atribuído</option>
                  {professores.map(p => (
                    <option key={p.id} value={p.id}>{p.nome_completo}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.professor_titular_id}
                  onChange={(e) => setFormData({ ...formData, professor_titular_id: e.target.value })}
                  className="input-field"
                  placeholder="ID do professor"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vagas *
              </label>
              <input
                type="number"
                value={formData.vagas}
                onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
                className="input-field"
                min="1"
                required
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
              {editingId ? 'Guardar Alterações' : 'Criar Turma'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!selectedTurma} 
        onClose={() => setSelectedTurma(null)}
        title="Detalhes da Turma"
        size="lg"
      >
        {selectedTurma && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTurma.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ano Letivo</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTurma.ano_letivo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nível</p>
                <p className="font-medium text-gray-900 dark:text-white">{getNivelLabel(selectedTurma.nivel)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instituição</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTurma.instituicao_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Professor Titular</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTurma.professor_nome || 'Não atribuído'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vagas</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTurma.vagas_ocupadas}/{selectedTurma.vagas}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Ocupação</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((selectedTurma.vagas_ocupadas / selectedTurma.vagas) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(selectedTurma.vagas_ocupadas / selectedTurma.vagas) * 100}%` }}
                ></div>
              </div>
            </div>

            {selectedTurma.alunos?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  <Users className="w-5 h-5 inline mr-2" />
                  Alunos Matriculados ({selectedTurma.alunos.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTurma.alunos.map((aluno, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary dark:text-primary-light">
                            {aluno.nome_completo.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{aluno.nome_completo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{aluno.numero_estudante}</p>
                        </div>
                      </div>
                      <StatusChip status={aluno.estado} size="sm" />
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

export default Turmas;
