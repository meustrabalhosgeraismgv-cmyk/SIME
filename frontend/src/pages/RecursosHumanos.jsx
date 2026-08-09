import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, GraduationCap, Award, RefreshCw } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { rhService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CRITERIOS = [
  { id: 'pontualidade', label: 'Pontualidade', peso: 1 },
  { id: 'assiduidade', label: 'Assiduidade', peso: 1 },
  { id: 'qualidade', label: 'Qualidade do trabalho', peso: 1 },
  { id: 'iniciativa', label: 'Iniciativa e proatividade', peso: 1 },
  { id: 'relacionamento', label: 'Relacionamento interpessoal', peso: 1 },
  { id: 'cumprimento', label: 'Cumprimento de tarefas', peso: 1 },
];

const RecursosHumanos = () => {
  const { hasRole } = useAuth();
  const [funcionarios, setFuncionarios] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [stats, setStats] = useState({ total: 0, ativos: 0, afastados: 0, aposentados: 0, docentes: 0, naoDocentes: 0, total_avaliacoes: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFunc, setSelectedFunc] = useState(null);
  const [showAvalModal, setShowAvalModal] = useState(false);
  const [avaliacaoFunc, setAvaliacaoFunc] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '', bi: '', data_nascimento: '', telefone: '', email: '',
    cargo: 'Docente', departamento: '', formacao: '', especialidade: '',
    numero_funcionario: '', instituicao_id: '', estado: 'ativo'
  });
  const [avaliacaoForm, setAvaliacaoForm] = useState({
    funcionario_id: '', periodo_inicio: '', periodo_fim: '', observacoes: '',
    criterios: {}
  });

  const canEdit = hasRole('admin', 'instituicao', 'diretor');

  useEffect(() => {
    loadFuncionarios();
  }, [pagination.page]);

  useEffect(() => {
    loadAvaliacoes();
  }, []);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        rhService.getAll({ page: pagination.page, limit: 10, search }),
        rhService.getStats().catch(() => ({ data: {} }))
      ]);
      setFuncionarios(listRes.data.data);
      setPagination(listRes.data.pagination);
      setStats(prev => ({ ...prev, ...statsRes.data }));
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvaliacoes = async () => {
    try {
      const res = await rhService.getAvaliacoes({ limit: 100 });
      setAvaliacoes(res.data.data);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await rhService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Funcionário atualizado com sucesso!' });
      } else {
        await rhService.create(formData);
        setAlert({ type: 'success', message: 'Funcionário registado com sucesso!' });
      }
      setShowModal(false);
      resetForm();
      loadFuncionarios();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar funcionário' });
    }
  };

  const handleEdit = (f) => {
    setFormData({
      nome_completo: f.nome_completo, bi: f.bi || '', data_nascimento: f.data_nascimento ? f.data_nascimento.slice(0, 10) : '',
      telefone: f.telefone || '', email: f.email || '', cargo: f.cargo || 'Docente',
      departamento: f.departamento || '', formacao: f.formacao || '', especialidade: f.especialidade || '',
      numero_funcionario: f.numero_funcionario, instituicao_id: f.instituicao_id || '', estado: f.estado
    });
    setEditingId(f.id);
    setShowModal(true);
  };

  const handleView = async (f) => {
    try {
      const response = await rhService.getById(f.id);
      setSelectedFunc(response.data);
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar este funcionário?')) {
      try {
        await rhService.delete(id);
        setAlert({ type: 'success', message: 'Funcionário eliminado!' });
        loadFuncionarios();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar funcionário' });
      }
    }
  };

  const openAvaliacao = (f) => {
    setAvaliacaoFunc(f);
    setAvaliacaoForm({
      funcionario_id: f.id,
      periodo_inicio: new Date().toISOString().slice(0, 10),
      periodo_fim: '',
      observacoes: '',
      criterios: {}
    });
    setShowAvalModal(true);
  };

  const handleSubmitAvaliacao = async (e) => {
    e.preventDefault();
    try {
      const criterios = avaliacaoForm.criterios;
      const valores = Object.values(criterios).map(v => parseFloat(v)).filter(v => !isNaN(v));
      const pontuacao_maxima = CRITERIOS.length * 20;
      const pontuacao_total = valores.length ? Math.round((valores.reduce((a, b) => a + b, 0) / pontuacao_maxima) * 100 * 10) / 10 : 0;
      let classificacao = 'Suficiente';
      if (pontuacao_total >= 90) classificacao = 'Excelente';
      else if (pontuacao_total >= 75) classificacao = 'Muito Bom';
      else if (pontuacao_total >= 50) classificacao = 'Bom';
      else if (pontuacao_total >= 30) classificacao = 'Suficiente';
      else classificacao = 'Insuficiente';

      await rhService.createAvaliacao({
        ...avaliacaoForm,
        criterios,
        pontuacao_total,
        pontuacao_maxima,
        classificacao
      });
      setAlert({ type: 'success', message: `Avaliação registada (${classificacao} - ${pontuacao_total}%)!` });
      setShowAvalModal(false);
      loadAvaliacoes();
      loadFuncionarios();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao registar avaliação' });
    }
  };

  const getClassificacaoColor = (cl) => {
    const map = {
      'Excelente': 'text-success-600 bg-success-50',
      'Muito Bom': 'text-primary-600 bg-primary-50',
      'Bom': 'text-primary-600 bg-primary-50',
      'Suficiente': 'text-warning-600 bg-warning-50',
      'Insuficiente': 'text-error-600 bg-error-50',
    };
    return map[cl] || 'text-gray-600 bg-gray-100';
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '', bi: '', data_nascimento: '', telefone: '', email: '',
      cargo: 'Docente', departamento: '', formacao: '', especialidade: '',
      numero_funcionario: '', instituicao_id: '', estado: 'ativo'
    });
    setEditingId(null);
  };

  const columns = [
    { header: 'Nome', accessor: 'nome_completo', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.nome_completo}</span>
    )},
    { header: 'Nº Funcionário', accessor: 'numero_funcionario' },
    { header: 'Cargo', accessor: 'cargo', render: (row) => (
      <span className="capitalize">{row.cargo}</span>
    )},
    { header: 'Departamento', accessor: 'departamento' },
    { header: 'Avaliações', accessor: 'total_avaliacoes', render: (row) => (
      <span className="inline-flex items-center gap-1">
        <Award className="w-4 h-4 text-warning-500" /> {row.total_avaliacoes || 0}
      </span>
    )},
    { header: 'Estado', accessor: 'estado', render: (row) => <StatusChip status={row.estado} /> },
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); handleView(row); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title="Ver">
          <Eye className="w-4 h-4" />
        </button>
        {canEdit && (
          <>
            <button onClick={(e) => { e.stopPropagation(); openAvaliacao(row); }} className="p-2 hover:bg-success/10 rounded-lg text-success" title="Avaliar">
              <Award className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-2 hover:bg-warning/10 rounded-lg text-warning" title="Editar">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-2 hover:bg-error/10 rounded-lg text-error" title="Eliminar">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recursos Humanos</h2>
          <p className="text-gray-500 dark:text-gray-400">Funcionários e Avaliação de Desempenho</p>
        </div>
        {canEdit && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Funcionário
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('funcionarios')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${activeTab === 'funcionarios' ? 'bg-primary text-white' : 'bg-white dark:bg-navy-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-navy-700'}`}
        >
          Funcionários
        </button>
        <button
          onClick={() => setActiveTab('avaliacoes')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${activeTab === 'avaliacoes' ? 'bg-primary text-white' : 'bg-white dark:bg-navy-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-navy-700'}`}
        >
          Avaliações de Desempenho ({avaliacoes.length})
        </button>
      </div>

      {activeTab === 'funcionarios' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-success">
              <p className="text-3xl font-bold text-success">{stats.ativos}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-primary">
              <p className="text-3xl font-bold text-primary">{stats.docentes}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Docentes</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-warning">
              <p className="text-3xl font-bold text-warning">{stats.total_avaliacoes}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avaliações</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: 1 })); loadFuncionarios(); }} className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome, nº funcionário ou cargo..." className="input-field pl-10" />
              </div>
              <button type="submit" className="btn-primary">Pesquisar</button>
            </div>
          </form>

          {loading ? <Loading /> : (
            <DataTable columns={columns} data={funcionarios} pagination={pagination} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} onRowClick={(row) => handleView(row)} />
          )}
        </>
      )}

      {activeTab === 'avaliacoes' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-warning-500" /> Avaliações de Desempenho
            </h3>
          </div>
          {avaliacoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>Ainda não existem avaliações registadas.</p>
              <p className="text-sm">Clique no ícone de avaliação num funcionário para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Período</th>
                    <th>Pontuação</th>
                    <th>Classificação</th>
                    <th>Avaliador</th>
                  </tr>
                </thead>
                <tbody>
                  {avaliacoes.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium text-gray-900 dark:text-white">{a.funcionario_nome}</td>
                      <td>{new Date(a.periodo_inicio).toLocaleDateString('pt-PT')}{a.periodo_fim ? ` → ${new Date(a.periodo_fim).toLocaleDateString('pt-PT')}` : ''}</td>
                      <td className="font-medium">{a.pontuacao_total}%</td>
                      <td><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getClassificacaoColor(a.classificacao)} dark:bg-opacity-10`}>{a.classificacao}</span></td>
                      <td>{a.avaliador}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
              <input type="text" value={formData.nome_completo} onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BI</label>
              <input type="text" value={formData.bi} onChange={(e) => setFormData({ ...formData, bi: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Funcionário *</label>
              <input type="text" value={formData.numero_funcionario} onChange={(e) => setFormData({ ...formData, numero_funcionario: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
              <input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo *</label>
              <select value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="input-field">
                <option value="Docente">Docente</option>
                <option value="Professor">Professor</option>
                <option value="Diretor">Diretor</option>
                <option value="Subdiretor">Subdiretor</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Secretário(a)">Secretário(a)</option>
                <option value="Auxiliar">Auxiliar</option>
                <option value="Vigilante">Vigilante</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
              <input type="text" value={formData.departamento} onChange={(e) => setFormData({ ...formData, departamento: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
              <input type="text" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formação</label>
              <input type="text" value={formData.formacao} onChange={(e) => setFormData({ ...formData, formacao: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidade</label>
              <input type="text" value={formData.especialidade} onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instituição ID</label>
              <input type="text" value={formData.instituicao_id} onChange={(e) => setFormData({ ...formData, instituicao_id: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="input-field">
                <option value="ativo">Ativo</option>
                <option value="afastado">Afastado</option>
                <option value="aposentado">Aposentado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editingId ? 'Guardar Alterações' : 'Registar Funcionário'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedFunc} onClose={() => setSelectedFunc(null)} title={selectedFunc?.nome_completo || 'Detalhes'} size="lg">
        {selectedFunc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nº Funcionário</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.numero_funcionario}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cargo</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedFunc.cargo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.departamento || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Especialidade</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.especialidade || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.telefone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Formação</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFunc.formacao || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                <StatusChip status={selectedFunc.estado} />
              </div>
            </div>
            {selectedFunc.avaliacoes?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Avaliações de Desempenho</h4>
                <div className="space-y-2">
                  {selectedFunc.avaliacoes.map(a => (
                    <div key={a.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{a.classificacao} ({a.pontuacao_total}%)</p>
                        <p className="text-xs text-gray-500">{new Date(a.periodo_inicio).toLocaleDateString('pt-PT')}{a.periodo_fim ? ` → ${new Date(a.periodo_fim).toLocaleDateString('pt-PT')}` : ''}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getClassificacaoColor(a.classificacao)}`}>{a.classificacao}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showAvalModal} onClose={() => setShowAvalModal(false)} title={`Avaliação de Desempenho`} subtitle={avaliacaoFunc?.nome_completo} size="lg">
        <form onSubmit={handleSubmitAvaliacao} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início do período *</label>
              <input type="date" value={avaliacaoForm.periodo_inicio} onChange={(e) => setAvaliacaoForm({ ...avaliacaoForm, periodo_inicio: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim do período</label>
              <input type="date" value={avaliacaoForm.periodo_fim} onChange={(e) => setAvaliacaoForm({ ...avaliacaoForm, periodo_fim: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Critérios (0 a 20)</p>
            {CRITERIOS.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <label className="text-sm text-gray-700 dark:text-gray-300">{c.label}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={avaliacaoForm.criterios[c.id] ?? ''}
                  onChange={(e) => setAvaliacaoForm({ ...avaliacaoForm, criterios: { ...avaliacaoForm.criterios, [c.id]: e.target.value } })}
                  className="input-field w-24"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea rows={3} value={avaliacaoForm.observacoes} onChange={(e) => setAvaliacaoForm({ ...avaliacaoForm, observacoes: e.target.value })} className="input-field resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowAvalModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary flex items-center gap-2"><Award className="w-4 h-4" /> Registar Avaliação</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecursosHumanos;
