import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { alunoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Alunos = () => {
  const { hasRole } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    sexo: 'M',
    naturalidade: '',
    numero_estudante: '',
    encarregado_id: '',
    instituicao_id: '',
    estado: 'ativo'
  });

  useEffect(() => {
    loadAlunos();
  }, [pagination.page]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const response = await alunoService.getAll({
        page: pagination.page,
        limit: 10,
        search
      });
      setAlunos(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadAlunos();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await alunoService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Aluno atualizado com sucesso!' });
      } else {
        await alunoService.create(formData);
        setAlert({ type: 'success', message: 'Aluno registado com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadAlunos();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar aluno' });
    }
  };

  const handleEdit = (aluno) => {
    setFormData({
      nome_completo: aluno.nome_completo,
      data_nascimento: aluno.data_nascimento,
      sexo: aluno.sexo,
      naturalidade: aluno.naturalidade || '',
      numero_estudante: aluno.numero_estudante,
      encarregado_id: aluno.encarregado_id || '',
      instituicao_id: aluno.instituicao_id || '',
      estado: aluno.estado
    });
    setEditingId(aluno.id);
    setShowModal(true);
  };

  const handleView = async (aluno) => {
    try {
      const response = await alunoService.getById(aluno.id);
      setSelectedAluno(response.data);
    } catch (error) {
      console.error('Erro ao carregar aluno:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar este aluno?')) {
      try {
        await alunoService.delete(id);
        setAlert({ type: 'success', message: 'Aluno eliminado com sucesso!' });
        loadAlunos();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar aluno' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      data_nascimento: '',
      sexo: 'M',
      naturalidade: '',
      numero_estudante: '',
      encarregado_id: '',
      instituicao_id: '',
      estado: 'ativo'
    });
    setEditingId(null);
  };

  const columns = [
    { header: 'Nome', accessor: 'nome_completo', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.nome_completo}</span>
    )},
    { header: 'Nº Estudante', accessor: 'numero_estudante' },
    { header: 'Sexo', accessor: 'sexo', render: (row) => (
      <span>{row.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
    )},
    { header: 'Instituição', accessor: 'instituicao_nome' },
    { header: 'Encarregado', accessor: 'encarregado_nome' },
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alunos</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de alunos</p>
        </div>
        {hasRole('admin', 'diretor') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Aluno
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
              placeholder="Pesquisar por nome ou número de estudante..."
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
          data={alunos}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onRowClick={(row) => handleView(row)}
        />
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Aluno' : 'Novo Aluno'}
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
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexo *
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                className="input-field"
                required
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Naturalidade
              </label>
              <input
                type="text"
                value={formData.naturalidade}
                onChange={(e) => setFormData({ ...formData, naturalidade: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Estudante *
              </label>
              <input
                type="text"
                value={formData.numero_estudante}
                onChange={(e) => setFormData({ ...formData, numero_estudante: e.target.value })}
                className="input-field"
                required
              />
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
                <option value="transferido">Transferido</option>
                <option value="abandono">Abandono</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instituição *
              </label>
              <input
                type="number"
                value={formData.instituicao_id}
                onChange={(e) => setFormData({ ...formData, instituicao_id: e.target.value })}
                className="input-field"
                placeholder="ID da instituição"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Encarregado ID
              </label>
              <input
                type="number"
                value={formData.encarregado_id}
                onChange={(e) => setFormData({ ...formData, encarregado_id: e.target.value })}
                className="input-field"
                placeholder="ID do encarregado"
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
              {editingId ? 'Guardar Alterações' : 'Registar Aluno'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!selectedAluno} 
        onClose={() => setSelectedAluno(null)}
        title="Detalhes do Aluno"
        size="lg"
      >
        {selectedAluno && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.nome_completo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Número de Estudante</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.numero_estudante}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data de Nascimento</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedAluno.data_nascimento).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sexo</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Naturalidade</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.naturalidade || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                <StatusChip status={selectedAluno.estado} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instituição</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.instituicao_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Encarregado</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.encarregado_nome || 'Não informado'}</p>
              </div>
            </div>

            {selectedAluno.matriculas?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Matrículas</h4>
                <div className="space-y-2">
                  {selectedAluno.matriculas.map((matricula, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{matricula.turma_nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{matricula.ano_letivo} - {matricula.nivel}</p>
                      </div>
                      <StatusChip status={matricula.estado} />
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

export default Alunos;
