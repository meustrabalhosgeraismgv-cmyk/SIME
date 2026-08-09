import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, ShieldCheck, History } from 'lucide-react';
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
    estado: 'ativo',
    bi: '',
    telefone: '',
    email: '',
    morada: '',
    grupo_sanguineo: '',
    religiao: '',
    contacto_emergencia_nome: '',
    contacto_emergencia_telefone: '',
    controlo_parental_activo: false,
    controlo_parental_observacoes: ''
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
      const payload = {
        nome_completo: formData.nome_completo,
        data_nascimento: formData.data_nascimento,
        sexo: formData.sexo,
        naturalidade: formData.naturalidade,
        numero_estudante: formData.numero_estudante,
        encarregado_id: formData.encarregado_id,
        instituicao_id: formData.instituicao_id,
        estado: formData.estado,
        bi: formData.bi,
        telefone: formData.telefone,
        email: formData.email,
        morada: formData.morada,
        grupo_sanguineo: formData.grupo_sanguineo,
        religiao: formData.religiao,
        contacto_emergencia_nome: formData.contacto_emergencia_nome,
        contacto_emergencia_telefone: formData.contacto_emergencia_telefone,
        controlo_parental: {
          activo: formData.controlo_parental_activo,
          observacoes: formData.controlo_parental_observacoes,
          permissoes: formData.controlo_parental_activo ? { saida_escola: true, receber_visitas: true } : {},
          contactos_autorizados: formData.controlo_parental_activo ? [formData.contacto_emergencia_telefone].filter(Boolean) : []
        }
      };
      if (editingId) {
        await alunoService.update(editingId, payload);
        setAlert({ type: 'success', message: 'Aluno atualizado com sucesso!' });
      } else {
        await alunoService.create(payload);
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
    const cp = aluno.controlo_parental || {};
    setFormData({
      nome_completo: aluno.nome_completo,
      data_nascimento: aluno.data_nascimento,
      sexo: aluno.sexo,
      naturalidade: aluno.naturalidade || '',
      numero_estudante: aluno.numero_estudante,
      encarregado_id: aluno.encarregado_id || '',
      instituicao_id: aluno.instituicao_id || '',
      estado: aluno.estado,
      bi: aluno.bi || '',
      telefone: aluno.telefone || '',
      email: aluno.email || '',
      morada: aluno.morada || '',
      grupo_sanguineo: aluno.grupo_sanguineo || '',
      religiao: aluno.religiao || '',
      contacto_emergencia_nome: aluno.contacto_emergencia_nome || '',
      contacto_emergencia_telefone: aluno.contacto_emergencia_telefone || '',
      controlo_parental_activo: !!cp.activo,
      controlo_parental_observacoes: cp.observacoes || ''
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
      estado: 'ativo',
      bi: '',
      telefone: '',
      email: '',
      morada: '',
      grupo_sanguineo: '',
      religiao: '',
      contacto_emergencia_nome: '',
      contacto_emergencia_telefone: '',
      controlo_parental_activo: false,
      controlo_parental_observacoes: ''
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                BI / Documento
              </label>
              <input
                type="text"
                value={formData.bi}
                onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Morada
              </label>
              <input
                type="text"
                value={formData.morada}
                onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grupo Sanguíneo
              </label>
              <select
                value={formData.grupo_sanguineo}
                onChange={(e) => setFormData({ ...formData, grupo_sanguineo: e.target.value })}
                className="input-field"
              >
                <option value="">Selecione...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Religião
              </label>
              <input
                type="text"
                value={formData.religiao}
                onChange={(e) => setFormData({ ...formData, religiao: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contacto de Emergência (Nome)
              </label>
              <input
                type="text"
                value={formData.contacto_emergencia_nome}
                onChange={(e) => setFormData({ ...formData, contacto_emergencia_nome: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contacto de Emergência (Telefone)
              </label>
              <input
                type="text"
                value={formData.contacto_emergencia_telefone}
                onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefone: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2 p-4 bg-primary-50 dark:bg-navy-800 rounded-2xl border border-primary-200 dark:border-navy-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.controlo_parental_activo}
                  onChange={(e) => setFormData({ ...formData, controlo_parental_activo: e.target.checked })}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-primary-500" />
                  Controlo Parental Ativo
                </span>
              </label>
              {formData.controlo_parental_activo && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações / Condições
                  </label>
                  <textarea
                    rows={2}
                    value={formData.controlo_parental_observacoes}
                    onChange={(e) => setFormData({ ...formData, controlo_parental_observacoes: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Ex.: Autorizado a sair apenas com o encarregado..."
                  />
                </div>
              )}
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
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.telefone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Grupo Sanguíneo</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.grupo_sanguineo || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contacto Emergência</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedAluno.contacto_emergencia_nome ? `${selectedAluno.contacto_emergencia_nome} (${selectedAluno.contacto_emergencia_telefone || '—'})` : '—'}</p>
            </div>
          </div>

            {selectedAluno.controlo_parental?.activo && (
              <div className="mt-4 p-4 bg-primary-50 dark:bg-navy-800 rounded-2xl border border-primary-200 dark:border-navy-700">
                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-primary-500" /> Controlo Parental Ativo
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAluno.controlo_parental.observacoes || 'Sem observações adicionais registadas.'}
                </p>
                {selectedAluno.controlo_parental.contactos_autorizados?.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Contactos autorizados: {selectedAluno.controlo_parental.contactos_autorizados.join(', ')}
                  </p>
                )}
              </div>
            )}

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

            {selectedAluno.classificacoes?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-500" /> Histórico de Classificações
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th>Ano Letivo</th>
                        <th>Período</th>
                        <th>Média</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAluno.classificacoes.map((c) => (
                        <tr key={c._id || c.id}>
                          <td className="capitalize">{c.classe}</td>
                          <td>{c.ano_letivo}</td>
                          <td className="capitalize">{c.periodo}</td>
                          <td className={`font-bold ${parseFloat(c.media_geral) >= 10 ? 'text-success' : 'text-error'}`}>
                            {parseFloat(c.media_geral).toFixed(1)}
                          </td>
                          <td>
                            <StatusChip status={c.estado === 'aprovado' ? 'ativo' : 'abandono'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
