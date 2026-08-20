import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, Search, Clock, CheckCircle, XCircle, 
  AlertTriangle, School, Calendar, RefreshCw, FileText,
  HeartHandshake, BookOpen, Loader2
} from 'lucide-react';
import Loading from '../components/Loading';
import { solicitacaoService, matriculaService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const Solicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filtro, setFiltro] = useState('todas');
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
    if (!confirm(`Confirmar a matrícula online de "${sol.aluno_nome}" na ${sol.instituicao_nome}?`)) return;
    setSending(true);
    try {
      const res = await matriculaService.createEncarregado({ solicitacao_id: sol.id });
      showToast({ message: `Matrícula realizada! Nº de estudante: ${res.data.numero_estudante}`, type: 'success' });
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
    inscrito: solicitacoes.filter(s => s.estado === 'inscrito').length,
    rejeitada: solicitacoes.filter(s => s.estado === 'rejeitada').length,
  };

  if (loading) return <Loading text="A carregar as suas solicitações..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <button onClick={loadSolicitacoes} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
        <Link to="/app/area-encarregado" className="btn-primary flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Nova Solicitação
        </Link>
      </div>

      {/* Stats Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'aceite', label: 'Aceites' },
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

      {/* Solicitações List */}
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
                    {(sol.documentos || []).length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Documentos anexados: {sol.documentos.length} ({sol.documentos.map(d => d.nome).join(', ')})
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
                    {(sol.estado === 'aceite' || sol.estado === 'agendado') && (
                      <button onClick={() => fazerMatricula(sol)} disabled={sending}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                        Fazer Matrícula Online
                      </button>
                    )}
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
    </div>
  );
};

export default Solicitacoes;
