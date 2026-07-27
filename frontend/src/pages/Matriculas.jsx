import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { matriculaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Matriculas = () => {
  const { hasRole } = useAuth();
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    aluno_id: '',
    turma_id: '',
    ano_letivo: new Date().getFullYear()
  });

  useEffect(() => {
    loadMatriculas();
  }, [pagination.page]);

  const loadMatriculas = async () => {
    try {
      setLoading(true);
      const response = await matriculaService.getAll({
        page: pagination.page,
        limit: 10
      });
      setMatriculas(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await matriculaService.create(formData);
      setAlert({ type: 'success', message: 'Matrícula realizada com sucesso!' });
      setShowModal(false);
      resetForm();
      loadMatriculas();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao criar matrícula' });
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta matrícula?')) {
      try {
        await matriculaService.cancel(id);
        setAlert({ type: 'success', message: 'Matrícula cancelada com sucesso!' });
        loadMatriculas();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao cancelar matrícula' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      aluno_id: '',
      turma_id: '',
      ano_letivo: new Date().getFullYear()
    });
  };

  const columns = [
    { header: 'Aluno', accessor: 'aluno_nome', render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{row.aluno_nome}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{row.numero_estudante}</p>
      </div>
    )},
    { header: 'Turma', accessor: 'turma_nome' },
    { header: 'Instituição', accessor: 'instituicao_nome' },
    { header: 'Ano Letivo', accessor: 'ano_letivo' },
    { header: 'Data Matrícula', accessor: 'data_matricula', render: (row) => (
      <span>{new Date(row.data_matricula).toLocaleDateString('pt-BR')}</span>
    )},
    { header: 'Estado', accessor: 'estado', render: (row) => (
      <StatusChip status={row.estado} />
    )},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        {hasRole('admin', 'diretor') && row.estado === 'ativa' && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }}
            className="p-2 hover:bg-error/10 rounded-lg text-error dark:text-error-light dark:hover:bg-error/20"
            title="Cancelar Matrícula"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Matrículas</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestão de matrículas escolares</p>
        </div>
        {hasRole('admin', 'diretor') && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Matrícula
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

      {loading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={matriculas}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Nova Matrícula"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID do Aluno *
            </label>
            <input
              type="number"
              value={formData.aluno_id}
              onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
              className="input-field"
              placeholder="ID do aluno"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID da Turma *
            </label>
            <input
              type="number"
              value={formData.turma_id}
              onChange={(e) => setFormData({ ...formData, turma_id: e.target.value })}
              className="input-field"
              placeholder="ID da turma"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Realizar Matrícula
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Matriculas;
