import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  CheckCircle, XCircle, Clock, Loader2, RefreshCw, FileText, Download,
  ChevronDown, ChevronUp, X, Calendar, AlertTriangle, User, GraduationCap,
  Eye, Ban, ArrowRight, MessageSquare, CheckSquare
} from 'lucide-react';
import { solicitacaoService } from '../services/api';
import { connectSocket } from '../services/socketClient';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const ESTADO_META = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, next: 'Aceitar, agendar ou rejeitar' },
  aceite: { label: 'Aceite', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, next: 'Inscrever aluno' },
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar, next: 'Aguardar presença' },
  rejeitada: { label: 'Rejeitada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: Ban, next: 'Processo encerrado' },
  inscrito: { label: 'Inscrito', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckSquare, next: 'Aluno matriculado' },
};

const SolicitacoesGestor = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [working, setWorking] = useState(null);
  const [detail, setDetail] = useState(null);
  const [agendarModal, setAgendarModal] = useState(null);
  const [rejeitarModal, setRejeitarModal] = useState(null);
  const [agendarData, setAgendarData] = useState({ data: '', hora: '08:00', observacoes: '' });
  const [rejeitarObs, setRejeitarObs] = useState('');

  const fetchSolicitacoes = useCallback(async () => {
    try {
      const res = await solicitacaoService.getGestor();
      setSolicitacoes(res.data.data || []);
    } catch (error) {
      console.error('Erro:', error);
      showToast({ message: 'Erro ao carregar solicitações', type: 'error' });
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchSolicitacoes(); }, [fetchSolicitacoes]);

  useEffect(() => {
    const token = localStorage.getItem('sime_token');
    if (!token || !user?.entidade_id) return;
    const socket = connectSocket(token);
    const onNovo = (p) => {
      if (p?.instituicao_id === user.entidade_id) {
        setSolicitacoes(prev => [p, ...prev.filter(s => s.id !== p.id)]);
        showToast({ message: `Nova solicitação de "${p.aluno_nome}"`, type: 'info' });
      }
    };
    const onUpdate = (p) => {
      if (p?.instituicao_id === user.entidade_id) {
        setSolicitacoes(prev => [p, ...prev.filter(s => s.id !== p.id)]);
      }
    };
    socket?.on('solicitacao:novo', onNovo);
    socket?.on('solicitacao:update', onUpdate);
    return () => {
      socket?.off('solicitacao:novo', onNovo);
      socket?.off('solicitacao:update', onUpdate);
    };
  }, [user?.entidade_id, showToast]);

  const handleAceitar = async (id) => {
    setWorking(id);
    try {
      await solicitacaoService.aceitar(id);
      showToast({ message: 'Solicitação aceite! Comunicado automático enviado ao encarregado.', type: 'success' });
      fetchSolicitacoes();
      setDetail(null);
    } catch (error) {
      showToast({ message: error.response?.data?.error || 'Erro ao aceitar', type: 'error' });
    } finally { setWorking(null); }
  };

  const handleAgendar = async () => {
    if (!agendarData.data) { showToast({ message: 'Selecione a data', type: 'warning' }); return; }
    setWorking(agendarModal.id);
    try {
      await solicitacaoService.agendar(agendarModal.id, {
        data_agendada: agendarData.data,
        hora_agendada: agendarData.hora,
        observacoes: agendarData.observacoes
      });
      showToast({ message: `Solicitação agendada para ${new Date(agendarData.data).toLocaleDateString('pt-AO')} às ${agendarData.hora}`, type: 'success' });
      fetchSolicitacoes();
      setAgendarModal(null);
      setAgendarData({ data: '', hora: '08:00', observacoes: '' });
      setDetail(null);
    } catch (error) {
      showToast({ message: error.response?.data?.error || 'Erro ao agendar', type: 'error' });
    } finally { setWorking(null); }
  };

  const handleRejeitar = async () => {
    setWorking(rejeitarModal.id);
    try {
      await solicitacaoService.rejeitar(rejeitarModal.id, { observacoes: rejeitarObs });
      showToast({ message: 'Solicitação rejeitada.', type: 'info' });
      fetchSolicitacoes();
      setRejeitarModal(null);
      setRejeitarObs('');
      setDetail(null);
    } catch (error) {
      showToast({ message: error.response?.data?.error || 'Erro ao rejeitar', type: 'error' });
    } finally { setWorking(null); }
  };

  const handleInscrever = async (id) => {
    setWorking(id);
    try {
      await solicitacaoService.inscrever(id);
      showToast({ message: 'Aluno inscrito com sucesso!', type: 'success' });
      fetchSolicitacoes();
      setDetail(null);
    } catch (error) {
      showToast({ message: error.response?.data?.error || 'Erro ao inscrever', type: 'error' });
    } finally { setWorking(null); }
  };

  const filtradas = filtro === 'todas' ? solicitacoes : solicitacoes.filter(s => s.estado === filtro);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inner = theme === 'dark' ? 'bg-navy-700' : 'bg-gray-50';
  const border = theme === 'dark' ? 'border-navy-600' : 'border-gray-200';

  const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative ${card} border ${border} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-5 border-b ${border}`}>
          <h2 className={`text-lg font-bold ${text}`}>{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-navy-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );

  const docUrl = (url) => url?.startsWith('http') ? url : `${API_URL}${url}`;

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Solicitações</h1>
              <p className={`text-sm ${subtext}`}>Gerir pedidos de inscrição recebidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${subtext}`}>{solicitacoes.length} total</span>
            <button onClick={fetchSolicitacoes} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['todas', 'pendente', 'aceite', 'rejeitada', 'agendado', 'inscrito'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f ? 'bg-primary-500 text-white' : `${card} border ${text}`
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <div className={`${card} border rounded-2xl p-12 text-center`}>
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={`${text} font-medium`}>Nenhuma solicitação encontrada</p>
            </div>
          ) : filtradas.map(s => {
            const meta = ESTADO_META[s.estado] || ESTADO_META.pendente;
            const docs = s.documentos || [];
            const formResps = s.formulario_respostas || [];

            return (
              <div key={s.id} className={`${card} border rounded-2xl overflow-hidden`}>
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-semibold ${text}`}>{s.aluno_nome}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                        {(docs.length > 0 || formResps.length > 0) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {docs.length} docs • {formResps.length} campos
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${subtext}`}>
                        <User className="w-3.5 h-3.5 inline mr-1" />
                        {s.encarregado_nome} • {s.encarregado_telefone}
                      </p>
                      {s.turma_nome && (
                        <p className={`text-xs mt-1 text-primary-500 font-medium`}>
                          <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
                          {s.turma_nome} ({s.turma_nivel})
                        </p>
                      )}
                      {s.data_agendada && (
                        <p className={`text-xs mt-1 text-blue-600 font-medium`}>
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Agendado: {new Date(s.data_agendada).toLocaleDateString('pt-AO')} às {s.hora_agendada || '—'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setDetail(s)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-navy-700 hover:bg-gray-300 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                      </button>
                      {s.estado === 'pendente' && (
                        <>
                          <button onClick={() => handleAceitar(s.id)} disabled={working === s.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                          </button>
                          <button onClick={() => setAgendarModal(s)} disabled={working === s.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                            <Calendar className="w-3.5 h-3.5" /> Agendar
                          </button>
                          <button onClick={() => setRejeitarModal(s)} disabled={working === s.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> Rejeitar
                          </button>
                        </>
                      )}
                      {s.estado === 'aceite' && (
                        <button onClick={() => handleInscrever(s.id)} disabled={working === s.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          <CheckSquare className="w-3.5 h-3.5" /> Inscrever
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs ${subtext} mt-2`}>
                    Criado: {new Date(s.created_at).toLocaleDateString('pt-AO')} {new Date(s.created_at).toLocaleTimeString('pt-AO')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detail && (() => {
        const meta = ESTADO_META[detail.estado] || ESTADO_META.pendente;
        const docs = detail.documentos || [];
        const formResps = detail.formulario_respostas || [];
        const historico = detail.historico || [];
        return (
          <Modal onClose={() => setDetail(null)} title={`Solicitação — ${detail.aluno_nome}`}>
            <div className="space-y-5">
              {/* Estado + Próximo passo */}
              <div className={`p-3 rounded-xl ${inner} border ${border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <meta.icon className="w-4 h-4" />
                  <span className={`text-sm font-semibold ${text}`}>Estado: {meta.label}</span>
                </div>
                <p className={`text-xs ${subtext} flex items-center gap-1`}>
                  <ArrowRight className="w-3 h-3" /> Próximo passo: {meta.next}
                </p>
                {detail.data_agendada && (
                  <p className={`text-xs text-blue-600 mt-1 font-medium`}>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Presença marcada para {new Date(detail.data_agendada).toLocaleDateString('pt-AO')} às {detail.hora_agendada || '—'}
                  </p>
                )}
              </div>

              {/* Dados do Aluno */}
              <div>
                <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Dados do Aluno</h4>
                <div className={`p-3 rounded-xl ${inner} border ${border} space-y-1.5`}>
                  <div className="flex justify-between text-xs">
                    <span className={subtext}>Nome</span>
                    <span className={`font-medium ${text}`}>{detail.aluno_nome}</span>
                  </div>
                  {detail.aluno_data_nascimento && (
                    <div className="flex justify-between text-xs">
                      <span className={subtext}>Data de Nascimento</span>
                      <span className={`font-medium ${text}`}>{new Date(detail.aluno_data_nascimento).toLocaleDateString('pt-AO')}</span>
                    </div>
                  )}
                  {detail.aluno_sexo && (
                    <div className="flex justify-between text-xs">
                      <span className={subtext}>Sexo</span>
                      <span className={`font-medium ${text}`}>{detail.aluno_sexo}</span>
                    </div>
                  )}
                  {detail.aluno_bi && (
                    <div className="flex justify-between text-xs">
                      <span className={subtext}>BI</span>
                      <span className={`font-medium ${text}`}>{detail.aluno_bi}</span>
                    </div>
                  )}
                  {detail.necessidades_especiais && detail.necessidades_especiais !== 'Nenhuma' && (
                    <div className="flex justify-between text-xs">
                      <span className={subtext}>Necessidades Especiais</span>
                      <span className="font-medium text-amber-600">{detail.necessidades_especiais}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Encarregado */}
              <div>
                <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Encarregado</h4>
                <div className={`p-3 rounded-xl ${inner} border ${border} space-y-1.5`}>
                  <div className="flex justify-between text-xs">
                    <span className={subtext}>Nome</span>
                    <span className={`font-medium ${text}`}>{detail.encarregado_nome}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={subtext}>Telefone</span>
                    <span className={`font-medium ${text}`}>{detail.encarregado_telefone}</span>
                  </div>
                </div>
              </div>

              {/* Turma */}
              {detail.turma_nome && (
                <div>
                  <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Turma Pretendida</h4>
                  <div className={`p-3 rounded-xl ${inner} border ${border}`}>
                    <p className={`text-sm font-medium ${text}`}>{detail.turma_nome}</p>
                    <p className={`text-xs ${subtext}`}>{detail.turma_nivel}</p>
                  </div>
                </div>
              )}

              {/* Ficha de Inscrição */}
              {formResps.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Ficha de Inscrição ({formResps.length} campos)</h4>
                  <div className={`p-3 rounded-xl ${inner} border ${border} space-y-2`}>
                    {formResps.map((f, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                        <span className={`font-medium ${subtext} sm:min-w-[160px]`}>{f.label}</span>
                        <span className={`${text}`}>{f.valor || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentos */}
              {docs.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Documentos Anexados ({docs.length})</h4>
                  <div className="space-y-2">
                    {docs.map((d, i) => {
                      const url = docUrl(d.url);
                      const img = isImage(d.url);
                      return (
                        <div key={i} className={`p-3 rounded-xl ${inner} border ${border}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${text}`}>{d.nome || d.chave}</p>
                              <p className={`text-[11px] ${subtext}`}>{d.nome_ficheiro} • {formatSize(d.tamanho)}</p>
                            </div>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0">
                              <Download className="w-3.5 h-3.5" /> Abrir
                            </a>
                          </div>
                          {img && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-navy-600">
                              <img src={url} alt={d.nome} className="w-full max-h-64 object-contain bg-gray-100 dark:bg-navy-900"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                              <div className="hidden items-center justify-center p-4 text-xs text-gray-400">
                                <AlertTriangle className="w-4 h-4 mr-1" /> Imagem indisponível (ficheiro perdido no servidor)
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observações */}
              {detail.observacoes && (
                <div>
                  <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Observações</h4>
                  <div className={`p-3 rounded-xl ${inner} border ${border}`}>
                    <p className={`text-xs ${subtext}`}>{detail.observacoes}</p>
                  </div>
                </div>
              )}

              {/* Histórico */}
              {historico.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wider`}>Histórico</h4>
                  <div className="space-y-2">
                    {historico.map((h, i) => {
                      const hMeta = ESTADO_META[h.estado] || {};
                      return (
                        <div key={i} className={`flex items-start gap-3 p-2 rounded-lg ${inner} border ${border}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hMeta.color || 'bg-gray-200'}`}>
                            {hMeta.icon ? <hMeta.icon className="w-3 h-3" /> : <span className="text-[10px]">{i + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-medium ${text}`}>
                              {ESTADO_META[h.estado]?.label || h.estado}
                              {h.autor && <span className={`font-normal ${subtext}`}> — {h.autor}</span>}
                            </p>
                            {h.observacoes && <p className={`text-[11px] ${subtext} mt-0.5`}>{h.observacoes}</p>}
                            <p className={`text-[10px] ${subtext}`}>{new Date(h.data).toLocaleString('pt-AO')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ações */}
              {detail.estado === 'pendente' && (
                <div className={`flex gap-2 pt-2 border-t ${border}`}>
                  <button onClick={() => handleAceitar(detail.id)} disabled={working === detail.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Aceitar
                  </button>
                  <button onClick={() => { setAgendarModal(detail); setDetail(null); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                    <Calendar className="w-4 h-4" /> Agendar
                  </button>
                  <button onClick={() => { setRejeitarModal(detail); setDetail(null); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                </div>
              )}
              {detail.estado === 'aceite' && (
                <div className={`pt-2 border-t ${border}`}>
                  <button onClick={() => handleInscrever(detail.id)} disabled={working === detail.id}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                    <CheckSquare className="w-4 h-4" /> Inscrever Aluno
                  </button>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* AGENDAR MODAL */}
      {agendarModal && (
        <Modal onClose={() => { setAgendarModal(null); setAgendarData({ data: '', hora: '08:00', observacoes: '' }); }} title="Agendar Presença">
          <div className="space-y-4">
            <p className={`text-sm ${subtext}`}>Selecione a data e hora para a presença de <strong className={text}>{agendarModal.aluno_nome}</strong></p>
            <div>
              <label className={`block text-xs font-medium ${text} mb-1`}>Data *</label>
              <input type="date" value={agendarData.data}
                onChange={e => setAgendarData({ ...agendarData, data: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border ${border} ${inner} ${text} text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none`} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${text} mb-1`}>Hora</label>
              <input type="time" value={agendarData.hora}
                onChange={e => setAgendarData({ ...agendarData, hora: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border ${border} ${inner} ${text} text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none`} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${text} mb-1`}>Observações</label>
              <textarea value={agendarData.observacoes} rows={2}
                onChange={e => setAgendarData({ ...agendarData, observacoes: e.target.value })}
                placeholder="Instruções para o encarregado (opcional)"
                className={`w-full px-3 py-2 rounded-xl border ${border} ${inner} ${text} text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none`} />
            </div>
            <button onClick={handleAgendar} disabled={working === agendarModal.id || !agendarData.data}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {working === agendarModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Confirmar Agendamento
            </button>
          </div>
        </Modal>
      )}

      {/* REJEITAR MODAL */}
      {rejeitarModal && (
        <Modal onClose={() => { setRejeitarModal(null); setRejeitarObs(''); }} title="Rejeitar Solicitação">
          <div className="space-y-4">
            <p className={`text-sm ${subtext}`}>Tem certeza que deseja rejeitar a solicitação de <strong className={text}>{rejeitarModal.aluno_nome}</strong>?</p>
            <div>
              <label className={`block text-xs font-medium ${text} mb-1`}>Motivo da rejeição</label>
              <textarea value={rejeitarObs} rows={3}
                onChange={e => setRejeitarObs(e.target.value)}
                placeholder="Indique o motivo (será comunicado ao encarregado)"
                className={`w-full px-3 py-2 rounded-xl border ${border} ${inner} ${text} text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none`} />
            </div>
            <button onClick={handleRejeitar} disabled={working === rejeitarModal.id}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {working === rejeitarModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Confirmar Rejeição
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SolicitacoesGestor;
