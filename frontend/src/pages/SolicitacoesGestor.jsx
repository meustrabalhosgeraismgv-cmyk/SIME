import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { solicitacaoService } from '../services/api';
import { connectSocket } from '../services/socketClient';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const SolicitacoesGestor = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [working, setWorking] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
      if (p && p.instituicao_id === user.entidade_id) {
        setSolicitacoes(prev => [p, ...prev.filter(s => s.id !== p.id)]);
      }
    };
    const onUpdate = (p) => {
      if (p && p.instituicao_id === user.entidade_id) {
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

  const handleAction = async (id, action) => {
    setWorking(id);
    try {
      if (action === 'aceitar') await solicitacaoService.aceitar(id);
      else if (action === 'agendar') await solicitacaoService.agendar(id);
      else if (action === 'rejeitar') await solicitacaoService.rejeitar(id);
      else if (action === 'inscrever') await solicitacaoService.inscrever(id);
      const label = { aceitar: 'aceite', agendar: 'agendado', rejeitar: 'rejeitada', inscrever: 'inscrito' }[action];
      showToast({ message: `Solicitação ${label}!`, type: 'success' });
      fetchSolicitacoes();
    } catch (error) {
      console.error('Erro:', error);
      showToast({ message: error.response?.data?.error || 'Erro ao processar solicitação', type: 'error' });
    } finally { setWorking(null); }
  };

  const filtradas = filtro === 'todas' ? solicitacoes : solicitacoes.filter(s => s.estado === filtro);

  const estadoColors = {
    pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    aceite: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    inscrito: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const innerCard = theme === 'dark' ? 'bg-navy-700' : 'bg-gray-50';

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
          <button onClick={fetchSolicitacoes} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
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
            const isExpanded = expandedId === s.id;
            const docs = s.documentos || [];
            const formResps = s.formulario_respostas || [];
            const hasDetails = docs.length > 0 || formResps.length > 0 || s.necessidades_especiais || s.observacoes;

            return (
              <div key={s.id} className={`${card} border rounded-2xl p-5`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold ${text}`}>{s.aluno_nome}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColors[s.estado]}`}>
                        {s.estado}
                      </span>
                    </div>
                    <p className={`text-sm ${subtext}`}>
                      Encarregado: {s.encarregado_nome} • Tel: {s.encarregado_telefone}
                    </p>
                    {s.aluno_data_nascimento && (
                      <p className={`text-xs ${subtext} mt-0.5`}>
                        Nascimento: {new Date(s.aluno_data_nascimento).toLocaleDateString('pt-AO')} • Sexo: {s.aluno_sexo || '—'}
                      </p>
                    )}
                    {s.aluno_bi && (
                      <p className={`text-xs ${subtext}`}>BI: {s.aluno_bi}</p>
                    )}
                    {s.turma_nome && (
                      <p className={`text-xs mt-1 text-primary-500 font-medium`}>Turma pretendida: {s.turma_nome}</p>
                    )}
                    {s.necessidades_especiais && s.necessidades_especiais !== 'Nenhuma' && (
                      <p className={`text-xs mt-1 text-amber-600 font-medium`}>Necessidades especiais: {s.necessidades_especiais}</p>
                    )}
                    {s.comunicado_titulo && (
                      <p className="text-xs text-primary-500 mt-1">Comunicado: {s.comunicado_titulo}</p>
                    )}
                    <p className={`text-xs ${subtext} mt-1`}>
                      {new Date(s.created_at).toLocaleDateString('pt-AO')} {new Date(s.created_at).toLocaleTimeString('pt-AO')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-start">
                    {hasDetails && (
                      <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-navy-700 hover:bg-gray-300 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Detalhes
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                    {s.estado === 'pendente' && (
                      <>
                        <button onClick={() => handleAction(s.id, 'aceitar')} disabled={working === s.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                        </button>
                        <button onClick={() => handleAction(s.id, 'agendar')} disabled={working === s.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          Agendar
                        </button>
                        <button onClick={() => handleAction(s.id, 'rejeitar')} disabled={working === s.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                      </>
                    )}
                    {s.estado === 'aceite' && (
                      <button onClick={() => handleAction(s.id, 'inscrever')} disabled={working === s.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                        Inscrever
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className={`mt-4 p-4 rounded-xl ${innerCard} border ${theme === 'dark' ? 'border-navy-600' : 'border-gray-200'} space-y-3`}>
                    {formResps.length > 0 && (
                      <div>
                        <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wide`}>Ficha de Inscrição</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formResps.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className={`font-medium ${subtext} min-w-[120px]`}>{f.label}:</span>
                              <span className={`${text}`}>{f.valor || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {docs.length > 0 && (
                      <div>
                        <h4 className={`text-xs font-semibold ${text} mb-2 uppercase tracking-wide`}>Documentos Anexados ({docs.length})</h4>
                        <div className="space-y-2">
                          {docs.map((d, i) => {
                            const fullUrl = d.url?.startsWith('http') ? d.url : `${API_URL}${d.url}`;
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.url || '');
                            return (
                              <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-navy-600' : 'bg-white'} border ${theme === 'dark' ? 'border-navy-500' : 'border-gray-200'}`}>
                                <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-primary-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium ${text} truncate`}>{d.nome || d.chave}</p>
                                  <p className={`text-[10px] ${subtext}`}>{d.nome_ficheiro} • {formatSize(d.tamanho)}</p>
                                </div>
                                <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex-shrink-0">
                                  <Download className="w-3 h-3" /> Ver
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {s.observacoes && (
                      <div>
                        <h4 className={`text-xs font-semibold ${text} mb-1 uppercase tracking-wide`}>Observações</h4>
                        <p className={`text-xs ${subtext}`}>{s.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesGestor;
