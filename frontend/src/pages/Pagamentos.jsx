import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Wallet, Loader2, RefreshCw, CheckCircle, Clock, CreditCard, Upload, Receipt, AlertTriangle, FileText } from 'lucide-react';
import { pagamentoService, configuracaoGlobalService } from '../services/api';

const ESTADO_CONFIG = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  pago: { label: 'Comprovativo enviado', icon: Upload, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  confirmado: { label: 'Pago e confirmado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelado: { label: 'Cancelado', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const Pagamentos = () => {
  const { theme } = useTheme();
  const [transacoes, setTransacoes] = useState([]);
  const [plataformaAtiva, setPlataformaAtiva] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const [pagRes, globalRes] = await Promise.all([
        pagamentoService.getEncarregado().catch(() => ({ data: { data: [] } })),
        configuracaoGlobalService.get().catch(() => ({ data: { data: {} } })),
      ]);
      setTransacoes(pagRes.data.data || []);
      setPlataformaAtiva(!!globalRes.data.data?.pagamento_plataforma_ativado);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const pagarPlataforma = async (id) => {
    setWorking(id);
    setAlertMsg(null);
    try {
      const res = await pagamentoService.pagarPlataforma(id);
      setAlertMsg({ type: 'success', message: res.data?.message || 'Pagamento efetuado pela plataforma' });
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao efetuar pagamento' });
    } finally {
      setWorking(null);
    }
  };

  const uploadComprovativo = async (id, file) => {
    if (!file) return;
    setWorking(id);
    setAlertMsg(null);
    try {
      const res = await pagamentoService.uploadComprovativo(id, file);
      setAlertMsg({ type: 'success', message: res.data?.message || 'Comprovativo carregado. Aguarde a confirmação da instituição.' });
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao carregar comprovativo' });
    } finally {
      setWorking(null);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const formatar = (v) => (parseFloat(v) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const emDivida = transacoes.filter(t => ['pendente', 'pago'].includes(t.estado)).reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
  const pagos = transacoes.filter(t => t.estado === 'confirmado').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Os Meus Pagamentos</h1>
              <p className={`text-sm ${subtext}`}>Emolumentos, mensalidades, quotas e outros — tudo pelo portal, sem sair do sistema</p>
            </div>
          </div>
          <button onClick={loadAll} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            alertMsg.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <p className={`text-sm font-medium ${alertMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertMsg.message}</p>
            <button onClick={() => setAlertMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        {plataformaAtiva && (
          <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className={`text-sm ${text}`}>Pagamento pela plataforma <strong>ativo</strong>. Pode pagar diretamente com referência bancária gerada no sistema.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-amber-600`}>{transacoes.filter(t => t.estado === 'pendente').length}</p>
            <p className={`text-sm ${subtext}`}>Pendentes</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{formatar(emDivida)} <span className="text-xs font-normal">Kz</span></p>
            <p className={`text-sm ${subtext}`}>Total em dívida</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-green-600`}>{formatar(pagos)} <span className="text-xs font-normal">Kz</span></p>
            <p className={`text-sm ${subtext}`}>Pago e confirmado</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : transacoes.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={`${text} font-medium`}>Sem pagamentos registados</p>
            <p className={`${subtext} text-sm mt-1`}>Os emolumentos e mensalidades gerados nas suas solicitações e matrículas aparecerão aqui.</p>
          </div>
        ) : (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
              <h2 className={`text-lg font-semibold ${text}`}>Transações ({transacoes.length})</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {transacoes.map(t => {
                const config = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG.pendente;
                const Icon = config.icon;
                return (
                  <div key={t.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${text}`}>{t.tipo_taxa_nome || t.tipo_taxa}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            <Icon className="w-3 h-3" /> {config.label}
                          </span>
                        </div>
                        <p className={`text-sm ${subtext} mt-1`}>{t.descricao}{t.mes ? ` • ${t.mes}` : ''}</p>
                        {t.aluno_nome && <p className={`text-xs ${subtext}`}>Aluno: {t.aluno_nome}</p>}
                        {t.instituicao_nome && <p className={`text-xs ${subtext}`}>{t.instituicao_nome}</p>}
                        <p className={`text-xs ${subtext} mt-1`}>
                          Referência: <span className="font-mono text-primary-500">{t.referencia || '—'}</span>
                          {t.data_limite && <> • Limite: {new Date(t.data_limite).toLocaleDateString('pt-AO')}</>}
                        </p>
                        {t.comprovativo_url && (
                          <a href={t.comprovativo_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-primary-500 hover:underline">
                            <FileText className="w-3.5 h-3.5" /> Ver comprovativo
                          </a>
                        )}
                        {t.estado === 'pago' && !t.confirmado_por && (
                          <p className={`mt-1 text-xs ${subtext}`}>A aguardar confirmação da instituição.</p>
                        )}
                        {t.estado === 'confirmado' && t.recibo_numero && (
                          <p className={`mt-1 text-xs ${subtext}`}>Recibo: <span className="font-mono text-green-600">{t.recibo_numero}</span></p>
                        )}
                        {t.observacoes && (
                          <p className={`mt-1 text-xs ${subtext} bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded-lg`}>{t.observacoes}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <p className={`text-xl font-bold ${text}`}>{formatar(t.valor)} <span className="text-xs font-normal">Kz</span></p>
                        {t.estado === 'pendente' && (
                          <div className="flex flex-col gap-2 w-44">
                            {plataformaAtiva ? (
                              <button onClick={() => pagarPlataforma(t.id)} disabled={working === t.id}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium disabled:opacity-50">
                                {working === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                                Pagar pela Plataforma
                              </button>
                            ) : (
                              <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-medium">
                                {working === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                Carregar Comprovativo
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                                  onChange={e => {
                                    const f = e.target.files && e.target.files[0];
                                    if (f) uploadComprovativo(t.id, f);
                                    e.target.value = '';
                                  }} />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagamentos;