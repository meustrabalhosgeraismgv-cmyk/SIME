import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Phone, Search, Eye, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { denunciaService } from '../services/api';

const TIPOS = {
  sos: { label: 'SOS', color: 'text-error-600 bg-error-50' },
  denuncia: { label: 'Denúncia', color: 'text-warning-600 bg-warning-50' },
  sugerencia: { label: 'Sugestão', color: 'text-primary-600 bg-primary-50' },
  elogio: { label: 'Elogio', color: 'text-success-600 bg-success-50' },
};

const ESTADOS = {
  nova: { label: 'Nova', color: 'text-error-600 bg-error-50' },
  em_analise: { label: 'Em Análise', color: 'text-warning-600 bg-warning-50' },
  resolvida: { label: 'Resolvida', color: 'text-success-600 bg-success-50' },
};

const Denuncias = () => {
  const [denuncias, setDenuncias] = useState([]);
  const [stats, setStats] = useState({ total: 0, novas: 0, em_analise: 0, resolvidas: 0, sos: 0, denuncias: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filtro, setFiltro] = useState('');
  const [selected, setSelected] = useState(null);
  const [showResposta, setShowResposta] = useState(false);
  const [resposta, setResposta] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadDenuncias();
  }, [pagination.page, filtro]);

  const loadDenuncias = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        denunciaService.getAll({ page: pagination.page, limit: 10, estado: filtro }),
        denunciaService.getStats().catch(() => ({ data: {} }))
      ]);
      setDenuncias(listRes.data.data);
      setPagination(listRes.data.pagination);
      setStats(prev => ({ ...prev, ...statsRes.data }));
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (d) => {
    try {
      const res = await denunciaService.getById(d.id);
      setSelected(res.data);
    } catch (error) {
      console.error('Erro ao carregar denúncia:', error);
    }
  };

  const handleEstado = async (id, novoEstado) => {
    try {
      await denunciaService.update(id, { estado: novoEstado });
      setAlert({ type: 'success', message: `Denúncia marcada como ${ESTADOS[novoEstado]?.label || novoEstado}!` });
      loadDenuncias();
      setSelected(null);
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao atualizar denúncia' });
    }
  };

  const handleResposta = async (e) => {
    e.preventDefault();
    try {
      await denunciaService.update(selected.id, { resposta, estado: 'resolvida' });
      setAlert({ type: 'success', message: 'Resposta enviada e denúncia resolvida!' });
      setShowResposta(false);
      setResposta('');
      loadDenuncias();
      setSelected(null);
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao enviar resposta' });
    }
  };

  const columns = [
    { header: 'Tipo', accessor: 'tipo', render: (row) => {
      const t = TIPOS[row.tipo] || { label: row.tipo, color: 'text-gray-600 bg-gray-100' };
      return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.color}`}>{t.label}</span>;
    }},
    { header: 'Assunto', accessor: 'assunto', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.assunto}</span>
    )},
    { header: 'Descrição', accessor: 'descricao', render: (row) => (
      <span className="block max-w-xs truncate text-gray-500 dark:text-gray-400">{row.descricao}</span>
    )},
    { header: 'Instituição', accessor: 'instituicao_nome', render: (row) => row.instituicao_nome || '—' },
    { header: 'Anónima', accessor: 'anonimo', render: (row) => row.anonimo ? <span className="text-gray-500">Sim</span> : <span className="text-success font-medium">{row.nome || '—'}</span> },
    { header: 'Data', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString('pt-PT') },
    { header: 'Estado', accessor: 'estado', render: (row) => {
      const e = ESTADOS[row.estado] || { label: row.estado, color: 'text-gray-600 bg-gray-100' };
      return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${e.color}`}>{e.label}</span>;
    }},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleView(row); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title="Ver detalhes">
        <Eye className="w-4 h-4" />
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SOS & Denúncias</h2>
          <p className="text-gray-500 dark:text-gray-400">Canal de denúncias, SOS e sugestões das comunidades escolares</p>
        </div>
        <div className="flex items-center gap-2 bg-error-50 dark:bg-error-900/20 px-4 py-2 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-error-600" />
          <span className="text-sm font-semibold text-error-600">{stats.sos} SOS</span>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-error">
          <p className="text-3xl font-bold text-error">{stats.novas}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Novas</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-warning">
          <p className="text-3xl font-bold text-warning">{stats.em_analise}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Em Análise</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-success">
          <p className="text-3xl font-bold text-success">{stats.resolvidas}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Resolvidas</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-primary">
          <p className="text-3xl font-bold text-primary">{stats.denuncias}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Denúncias</p>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <button onClick={() => setFiltro('')} className={`px-4 py-2 rounded-2xl font-medium text-sm transition-colors ${filtro === '' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Todos</button>
          <button onClick={() => setFiltro('nova')} className={`px-4 py-2 rounded-2xl font-medium text-sm transition-colors ${filtro === 'nova' ? 'bg-error text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Novas</button>
          <button onClick={() => setFiltro('em_analise')} className={`px-4 py-2 rounded-2xl font-medium text-sm transition-colors ${filtro === 'em_analise' ? 'bg-warning text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Em Análise</button>
          <button onClick={() => setFiltro('resolvida')} className={`px-4 py-2 rounded-2xl font-medium text-sm transition-colors ${filtro === 'resolvida' ? 'bg-success text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Resolvidas</button>
        </div>

        {loading ? <Loading /> : (
          <DataTable columns={columns} data={denuncias} pagination={pagination} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} onRowClick={(row) => handleView(row)} />
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalhes da Denúncia" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(TIPOS[selected.tipo] || {}).color || 'text-gray-600 bg-gray-100'}`}>{selected.tipo}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(ESTADOS[selected.estado] || {}).color || 'text-gray-600 bg-gray-100'}`}>{ESTADOS[selected.estado]?.label || selected.estado}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assunto</p>
              <p className="font-medium text-gray-900 dark:text-white">{selected.assunto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">{selected.descricao}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instituição</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.instituicao_nome || 'Não especificada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Local</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.local || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(selected.created_at).toLocaleString('pt-PT')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Anónima</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.anonimo ? 'Sim' : 'Não'}</p>
              </div>
              {!selected.anonimo && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selected.nome || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contacto</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selected.telefone || selected.email || '—'}</p>
                  </div>
                </>
              )}
            </div>

            {selected.resposta && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resposta</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-success-50 dark:bg-success-900/20 rounded-2xl p-4">{selected.resposta}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selected.estado === 'nova' && (
                <button onClick={() => handleEstado(selected.id, 'em_analise')} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Iniciar Análise
                </button>
              )}
              {(selected.estado === 'nova' || selected.estado === 'em_analise') && (
                <button onClick={() => setShowResposta(true)} className="btn-success flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Responder & Resolver
                </button>
              )}
              {selected.estado === 'em_analise' && (
                <button onClick={() => handleEstado(selected.id, 'nova')} className="btn-secondary flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reabrir
                </button>
              )}
              {selected.estado === 'resolvida' && (
                <button onClick={() => handleEstado(selected.id, 'em_analise')} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Reabrir
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showResposta} onClose={() => setShowResposta(false)} title="Responder à Denúncia" size="lg">
        <form onSubmit={handleResposta} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resposta *</label>
            <textarea rows={5} value={resposta} onChange={(e) => setResposta(e.target.value)} className="input-field resize-none" placeholder="Escreva a resposta e as medidas tomadas..." required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowResposta(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Enviar Resposta e Resolver</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Denuncias;
