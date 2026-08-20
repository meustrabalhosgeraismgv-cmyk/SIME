import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ClipboardCheck, Loader2, RefreshCw, CheckCircle, XCircle, Wallet, Bell, Plus, CreditCard,
  Upload, ShieldCheck, AlertTriangle, CalendarClock, BookOpen, FileText
} from 'lucide-react';
import { matriculaService, pagamentoService } from '../services/api';

const TIPOS_AVISO = [
  { tipo: 'mensalidade', nome: 'Mensalidade' },
  { tipo: 'uniforme', nome: 'Uniforme Escolar' },
  { tipo: 'transporte', nome: 'Transporte' },
  { tipo: 'atividade', nome: 'Atividade Extracurricular' },
  { tipo: 'quota', nome: 'Quota / Comparticipação' },
  { tipo: 'outro', nome: 'Outro' },
];

const ESTADO_PAG = {
  pendente: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  pago: { label: 'Comprovativo enviado', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  confirmado: { label: 'Confirmado', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelado: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const CicloVida = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [matriculas, setMatriculas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [avisoAlvo, setAvisoAlvo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  const isGestor = user?.perfil === 'instituicao';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const [matRes, pagRes] = await Promise.all([
        matriculaService.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        pagamentoService.getGestor({}).catch(() => ({ data: { data: [] } })),
      ]);
      setMatriculas(matRes.data.data || []);
      setTransacoes(pagRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const gerarMensalidades = async (matricula) => {
    setWorking('mens_' + matricula.id);
    setAlertMsg(null);
    try {
      const res = await pagamentoService.gerarMensalidades(matricula.id);
      setAlertMsg({ type: 'success', message: res.data?.message || 'Mensalidades geradas' });
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao gerar mensalidades' });
    } finally {
      setWorking(null);
    }
  };

  const confirmar = async (id) => {
    setWorking('conf_' + id);
    setAlertMsg(null);
    try {
      await pagamentoService.confirmar(id);
      setAlertMsg({ type: 'success', message: 'Pagamento confirmado' });
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro' });
    } finally {
      setWorking(null);
    }
  };

  const rejeitar = async (id) => {
    const obs = window.prompt('Motivo da recusa do comprovativo (opcional):');
    if (obs === null) return;
    setWorking('rej_' + id);
    setAlertMsg(null);
    try {
      await pagamentoService.rejeitar(id, obs || '');
      setAlertMsg({ type: 'success', message: 'Comprovativo recusado. O pagamento voltou a pendente.' });
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro' });
    } finally {
      setWorking(null);
    }
  };

  const enviarAviso = async () => {
    if (!avisoAlvo) return;
    if (!avisoAlvo.titulo.trim()) { setAlertMsg({ type: 'error', message: 'Indique o título do aviso' }); return; }
    setWorking('aviso_' + avisoAlvo.matricula_id);
    setAlertMsg(null);
    try {
      const res = await pagamentoService.avisar({
        tipo_taxa: avisoAlvo.tipo_taxa,
        titulo: avisoAlvo.titulo,
        conteudo: avisoAlvo.conteudo,
        valor: avisoAlvo.valor || 0,
        matricula_id: avisoAlvo.matricula_id,
        aluno_id: avisoAlvo.aluno_id,
        encarregado_id: avisoAlvo.encarregado_id,
      });
      setAlertMsg({ type: 'success', message: res.data?.message || 'Aviso enviado ao encarregado' });
      setAvisoAlvo(null);
      loadAll();
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao enviar aviso' });
    } finally {
      setWorking(null);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  const formatar = (v) => (parseFloat(v) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const filtradas = filtroEstado ? transacoes.filter(t => t.estado === filtroEstado) : transacoes;
  const aConfirmar = transacoes.filter(t => t.estado === 'pago').length;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Ciclo de Vida do Aluno</h1>
              <p className={`text-sm ${subtext}`}>Ficha do estudante, financeiro, mensalidades e comunicação — desde a matrícula até à conclusão da formação</p>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{matriculas.length}</p>
            <p className={`text-sm ${subtext}`}>Alunos Matriculados</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-amber-600`}>{transacoes.filter(t => t.estado === 'pendente').length}</p>
            <p className={`text-sm ${subtext}`}>Pagamentos Pendentes</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-blue-600`}>{aConfirmar}</p>
            <p className={`text-sm ${subtext}`}>Comprovativos a Confirmar</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-green-600`}>{formatar(transacoes.filter(t => t.estado === 'confirmado').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0))} <span className="text-xs font-normal">Kz</span></p>
            <p className={`text-sm ${subtext}`}>Recebido (confirmado)</p>
          </div>
        </div>

        {!isGestor && (
          <div className={`p-4 rounded-xl border ${card} flex items-start gap-3`}>
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className={`text-sm ${subtext}`}>Esta área é gerida pela instituição. O administrador também pode aceder em modo de apoio.</p>
          </div>
        )}

        {/* Alunos / Matrículas */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <h2 className={`text-lg font-semibold ${text}`}>Alunos Matriculados</h2>
          </div>
          {matriculas.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={`${subtext}`}>Sem matrículas ainda. As matrículas concluídas pelos encarregados aparecem aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {matriculas.map(m => {
                const pagosMat = transacoes.filter(t => t.matricula_id === m.id);
                const pendentesMat = pagosMat.filter(t => ['pendente', 'pago'].includes(t.estado));
                return (
                  <div key={m.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${text}`}>{m.aluno_nome}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <ShieldCheck className="w-3 h-3" /> {m.status_processo === 'matriculado' ? 'Matriculado' : (m.estado || 'Ativo')}
                          </span>
                        </div>
                        <p className={`text-sm ${subtext} mt-1`}>
                          Nº Estudante {m.numero_estudante || '—'} • Nº Processo <span className="font-mono text-primary-500">{m.numero_processo || '—'}</span>
                        </p>
                        <p className={`text-xs ${subtext}`}>Turma: {m.turma_nome || '—'} • {m.ano_letivo}</p>
                        {pagosMat.length > 0 && (
                          <p className={`text-xs ${subtext} mt-1`}>
                            {pagosMat.length} transações • <span className="text-amber-600">{pendentesMat.length} pendente(s)</span>
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-wrap gap-2">
                        <button onClick={() => gerarMensalidades(m)} disabled={working === 'mens_' + m.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          {working === 'mens_' + m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
                          Gerar Mensalidades
                        </button>
                        <button onClick={() => setAvisoAlvo({ matricula_id: m.id, aluno_id: m.aluno_id, encarregado_id: m.encarregado_id, tipo_taxa: 'mensalidade', valor: '', titulo: '', conteudo: '' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium">
                          <Bell className="w-3.5 h-3.5" /> Emitir Aviso
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transações */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <h2 className={`text-lg font-semibold ${text} flex items-center gap-2`}>
              <Wallet className="w-5 h-5 text-primary-500" /> Transações de Pagamento ({transacoes.length})
            </h2>
            <div className="flex gap-2">
              {[['', 'Todos'], ['pendente', 'Pendentes'], ['pago', 'Comprovativos'], ['confirmado', 'Confirmados']].map(([v, l]) => (
                <button key={v || 'all'} onClick={() => setFiltroEstado(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${filtroEstado === v ? 'bg-primary-500 text-white' : `border ${card} ${text}`}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {filtradas.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={`${subtext}`}>Nenhuma transação neste filtro.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {filtradas.map(t => {
                const config = ESTADO_PAG[t.estado] || ESTADO_PAG.pendente;
                return (
                  <div key={t.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${text}`}>{t.tipo_taxa_nome || t.tipo_taxa}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>
                        </div>
                        <p className={`text-sm ${subtext} mt-1`}>{t.descricao}{t.mes ? ` • ${t.mes}` : ''}</p>
                        <p className={`text-xs ${subtext}`}>
                          {t.aluno_nome ? `Aluno: ${t.aluno_nome} • ` : ''}Encarregado: {t.encarregado_nome || '—'}
                        </p>
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
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <p className={`text-xl font-bold ${text}`}>{formatar(t.valor)} <span className="text-xs font-normal">Kz</span></p>
                        {t.estado === 'pago' && (
                          <div className="flex gap-2">
                            <button onClick={() => confirmar(t.id)} disabled={working === 'conf_' + t.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                              {working === 'conf_' + t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Confirmar
                            </button>
                            <button onClick={() => rejeitar(t.id)} disabled={working === 'rej_' + t.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                              {working === 'rej_' + t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Recusar
                            </button>
                          </div>
                        )}
                        {t.estado === 'pendente' && t.forma_pagamento === 'plataforma' && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600"><CreditCard className="w-3.5 h-3.5" /> Pagamento pela plataforma</span>
                        )}
                        {t.estado === 'confirmado' && t.recibo_numero && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600"><Upload className="w-3.5 h-3.5" /> Recibo: {t.recibo_numero}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Emitir Aviso */}
        {avisoAlvo && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className={`${card} border rounded-2xl w-full max-w-lg p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${text}`}>Emitir Aviso de Pagamento</h2>
                <button onClick={() => setAvisoAlvo(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Tipo de pagamento</label>
                <select value={avisoAlvo.tipo_taxa} onChange={e => setAvisoAlvo({ ...avisoAlvo, tipo_taxa: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}>
                  {TIPOS_AVISO.map(t => <option key={t.tipo} value={t.tipo}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Valor (Kz) — 0 se apenas aviso</label>
                <input type="number" min="0" step="0.01" value={avisoAlvo.valor}
                  onChange={e => setAvisoAlvo({ ...avisoAlvo, valor: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="0" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Título *</label>
                <input type="text" value={avisoAlvo.titulo}
                  onChange={e => setAvisoAlvo({ ...avisoAlvo, titulo: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}
                  placeholder="Ex: Pagamento de mensalidade — Outubro" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Mensagem</label>
                <textarea value={avisoAlvo.conteudo} rows={3}
                  onChange={e => setAvisoAlvo({ ...avisoAlvo, conteudo: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}
                  placeholder="Instruções para o encarregado..." />
              </div>
              <p className={`text-xs ${subtext}`}>O aviso é entregue diretamente no portal do encarregado. Se indicar um valor, também é criada uma transação de pagamento pendente.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAvisoAlvo(null)} className={`px-4 py-2 rounded-xl border ${input} ${text} text-sm`}>Cancelar</button>
                <button onClick={enviarAviso} disabled={working === 'aviso_' + avisoAlvo.matricula_id}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {working === 'aviso_' + avisoAlvo.matricula_id && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Bell className="w-4 h-4" /> Enviar Aviso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CicloVida;