import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, CheckCircle, XCircle,
  School, Calendar, RefreshCw, FileText,
  HeartHandshake, BookOpen, Loader2, X, Download, Eye
} from 'lucide-react';
import Loading from '../components/Loading';
import { solicitacaoService, matriculaService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const docUrl = (url) => url?.startsWith('http') ? url : `${API_URL}${url}`;
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');

const Solicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [detail, setDetail] = useState(null);
  const [matriculaModal, setMatriculaModal] = useState(null);
  const { showToast } = useNotifications();

  useEffect(() => { loadSolicitacoes(); }, []);

  const loadSolicitacoes = async () => {
    try {
      setLoading(true);
      const res = await solicitacaoService.getEncarregado();
      setSolicitacoes(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      showToast({ message: 'Erro ao carregar solicitações', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fazerMatricula = async (sol) => {
    setSending(true);
    try {
      const res = await matriculaService.createEncarregado({ solicitacao_id: sol.id });
      showToast({ message: `Matrícula realizada! Nº de estudante: ${res.data.numero_estudante}`, type: 'success' });
      setMatriculaModal(null);
      loadSolicitacoes();
    } catch (error) {
      showToast({ message: error.response?.data?.error || 'Erro ao fazer a matrícula', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    if (filtro === 'todas') return true;
    return s.estado === filtro;
  });

  const getEstadoConfig = (estado) => {
    const configs = {
      pendente: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-500/10', chip: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400', label: 'Pendente' },
      aceite: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-500/10', chip: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400', label: 'Aceite' },
      rejeitada: { icon: XCircle, color: 'text-error-500', bg: 'bg-error-50 dark:bg-error-500/10', chip: 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400', label: 'Rejeitada' },
      inscrito: { icon: CheckCircle, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', chip: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400', label: 'Inscrito' },
      agendado: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', label: 'Agendado' },
    };
    return configs[estado] || configs.pendente;
  };

  const estadoCounts = {
    todas: solicitacoes.length,
    pendente: solicitacoes.filter(s => s.estado === 'pendente').length,
    aceite: solicitacoes.filter(s => s.estado === 'aceite').length,
    agendado: solicitacoes.filter(s => s.estado === 'agendado').length,
    inscrito: solicitacoes.filter(s => s.estado === 'inscrito').length,
    rejeitada: solicitacoes.filter(s => s.estado === 'rejeitada').length,
  };

  if (loading) return <Loading text="A carregar as suas solicitações..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-500" />
            As Minhas Solicitações
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe o estado dos seus pedidos de matrícula
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadSolicitacoes} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <Link to="/app/area-encarregado" className="btn-primary flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Nova Solicitação
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'aceite', label: 'Aceites' },
          { key: 'agendado', label: 'Agendados' },
          { key: 'inscrito', label: 'Inscritos' },
          { key: 'rejeitada', label: 'Rejeitadas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltro(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtro === tab.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filtro === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-navy-600'
            }`}>
              {estadoCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {filteredSolicitacoes.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {filtro === 'todas'
              ? 'Ainda não tem nenhuma solicitação'
              : `Nenhuma solicitação com estado "${filtro}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSolicitacoes.map((sol) => {
            const config = getEstadoConfig(sol.estado);
            const Icon = config.icon;
            const docs = sol.documentos || [];
            return (
              <div key={sol.id} className="card card-hover">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{sol.aluno_nome}</h4>
                      <span className={`status-chip text-[10px] ${config.chip}`}>
                        {config.label}
                      </span>
                      {docs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {docs.length} doc{docs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <School className="w-3 h-3" /> {sol.instituicao_nome}
                        {sol.turma_nome && <span className="text-primary-500 font-medium"> • {sol.turma_nome}</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(sol.created_at).toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                    {sol.data_agendada && (
                      <p className="mt-1 text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Agendado: {new Date(sol.data_agendada).toLocaleDateString('pt-AO')} às {sol.hora_agendada || '—'}
                      </p>
                    )}
                    {sol.comunicado_titulo && (
                      <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {sol.comunicado_titulo}
                      </p>
                    )}
                    {sol.necessidades_especiais && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <HeartHandshake className="w-3 h-3" /> {sol.necessidades_especiais}
                      </span>
                    )}
                    {(sol.historico || []).length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {sol.historico.map((h, i) => {
                          const hc = getEstadoConfig(h.estado);
                          const HIcon = hc.icon;
                          const isLast = i === sol.historico.length - 1;
                          return (
                            <div key={i} className="flex items-center gap-1">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${hc.bg} ${hc.color} ${isLast ? 'ring-1 ring-primary-300 dark:ring-primary-700' : 'opacity-60'}`}>
                                <HIcon className="w-3 h-3" /> {hc.label}
                              </div>
                              {!isLast && <span className="text-gray-400 text-xs">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {sol.observacoes && (
                      <p className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-navy-800 px-3 py-2 rounded-lg">
                        <span className="font-medium">Observação:</span> {sol.observacoes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button onClick={() => setDetail(sol)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-navy-700 hover:bg-gray-300 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                      </button>
                      {(sol.estado === 'aceite' || sol.estado === 'agendado') && (
                        <button onClick={() => setMatriculaModal(sol)} disabled={sending}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                          <BookOpen className="w-4 h-4" />
                          Fazer Matrícula Online
                        </button>
                      )}
                    </div>
                  </div>
                  {sol.data_resposta && (
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <p>Respondido em</p>
                      <p className="font-medium">{new Date(sol.data_resposta).toLocaleDateString('pt-AO')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {detail && (() => {
        const config = getEstadoConfig(detail.estado);
        const docs = detail.documentos || [];
        const formResps = detail.formulario_respostas || [];
        const historico = detail.historico || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-navy-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detalhes — {detail.aluno_nome}</h2>
                <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-navy-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600">
                  <div className="flex items-center gap-2 mb-1">
                    <config.icon className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Estado: {config.label}</span>
                  </div>
                  {detail.data_agendada && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Presença marcada para {new Date(detail.data_agendada).toLocaleDateString('pt-AO')} às {detail.hora_agendada || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Dados do Aluno</h4>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Nome</span>
                      <span className="font-medium text-gray-900 dark:text-white">{detail.aluno_nome}</span>
                    </div>
                    {detail.aluno_data_nascimento && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Data de Nascimento</span>
                        <span className="font-medium text-gray-900 dark:text-white">{new Date(detail.aluno_data_nascimento).toLocaleDateString('pt-AO')}</span>
                      </div>
                    )}
                    {detail.aluno_sexo && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Sexo</span>
                        <span className="font-medium text-gray-900 dark:text-white">{detail.aluno_sexo}</span>
                      </div>
                    )}
                    {detail.aluno_bi && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">BI</span>
                        <span className="font-medium text-gray-900 dark:text-white">{detail.aluno_bi}</span>
                      </div>
                    )}
                    {detail.necessidades_especiais && detail.necessidades_especiais !== 'Nenhuma' && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Necessidades Especiais</span>
                        <span className="font-medium text-amber-600">{detail.necessidades_especiais}</span>
                      </div>
                    )}
                  </div>
                </div>

                {detail.turma_nome && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Turma Pretendida</h4>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{detail.turma_nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{detail.turma_nivel}</p>
                    </div>
                  </div>
                )}

                {formResps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Ficha de Inscrição ({formResps.length} campos)</h4>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 space-y-2">
                      {formResps.map((f, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                          <span className="font-medium text-gray-500 dark:text-gray-400 sm:min-w-[160px]">{f.label}</span>
                          <span className="text-gray-900 dark:text-white">{f.valor || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {docs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Documentos Anexados ({docs.length})</h4>
                    <div className="space-y-2">
                      {docs.map((d, i) => {
                        const url = docUrl(d.url);
                        const img = isImage(d.url);
                        return (
                          <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-primary-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{d.nome || d.chave}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{d.nome_ficheiro} {d.tamanho ? `\u2022 ${formatSize(d.tamanho)}` : ''}</p>
                              </div>
                              <a href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0">
                                <Download className="w-3.5 h-3.5" /> Abrir
                              </a>
                            </div>
                            {img && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-navy-600">
                                <img src={url} alt={d.nome} className="w-full max-h-64 object-contain bg-gray-100 dark:bg-navy-900"
                                  onError={(e) => { e.target.style.display = 'none'; }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detail.observacoes && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Observações</h4>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{detail.observacoes}</p>
                    </div>
                  </div>
                )}

                {historico.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Histórico</h4>
                    <div className="space-y-2">
                      {historico.map((h, i) => {
                        const hMeta = getEstadoConfig(h.estado);
                        return (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hMeta.bg || 'bg-gray-200'}`}>
                              {hMeta.icon ? <hMeta.icon className="w-3 h-3" /> : <span className="text-[10px]">{i + 1}</span>}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                {hMeta.label || h.estado}
                                {h.autor && <span className="font-normal text-gray-500 dark:text-gray-400"> — {h.autor}</span>}
                              </p>
                              {h.observacoes && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{h.observacoes}</p>}
                              <p className="text-[10px] text-gray-400">{new Date(h.data).toLocaleString('pt-AO')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(detail.estado === 'aceite' || detail.estado === 'agendado') && (
                  <div className="pt-2 border-t border-gray-200 dark:border-navy-600">
                    <button onClick={() => { setDetail(null); setMatriculaModal(detail); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">
                      <BookOpen className="w-4 h-4" /> Fazer Matrícula Online
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MATRICULA MODAL */}
      {matriculaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setMatriculaModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-navy-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar Matrícula</h2>
              <button onClick={() => setMatriculaModal(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-navy-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Deseja iniciar a matrícula online de <strong className="text-gray-900 dark:text-white">{matriculaModal.aluno_nome}</strong> na <strong className="text-gray-900 dark:text-white">{matriculaModal.instituicao_nome}</strong>?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Será criado um registo de matrícula pendente. Poderá completar os requisitos e efetuar o pagamento posteriormente.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMatriculaModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-navy-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => fazerMatricula(matriculaModal)} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  Confirmar Matrícula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitacoes;
