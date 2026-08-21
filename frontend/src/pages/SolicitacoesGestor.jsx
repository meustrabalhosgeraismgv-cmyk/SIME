import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { CheckCircle, XCircle, Clock, Loader2, Eye, RefreshCw } from 'lucide-react';
import { solicitacaoService } from '../services/api';
import { connectSocket } from '../services/socketClient';

const SolicitacoesGestor = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [working, setWorking] = useState(null);

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
      const url = action === 'aceitar' ? `/${id}/aceitar`
        : action === 'agendar' ? `/${id}/agendar`
        : action === 'rejeitar' ? `/${id}/rejeitar`
        : action === 'inscrever' ? `/${id}/inscrever`
        : '';
      const res = await fetch(`/api/solicitacoes${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sime_token')}` },
        body: JSON.stringify({ observacoes: '' })
      });
      if (!res.ok) throw new Error('Erro');
      const label = { aceitar: 'aceite', agendar: 'agendado', rejeitar: 'rejeitada', inscrever: 'inscrito' }[action];
      showToast({ message: `Solicitação ${label}!`, type: 'success' });
      fetchSolicitacoes();
    } catch (error) {
      console.error('Erro:', error);
      showToast({ message: 'Erro ao processar solicitação', type: 'error' });
    } finally { setWorking(null); }
  };

  const filtroMap = {
    todas: null,
    pendente: 'pendente',
    aceite: 'aceite',
    rejeitada: 'rejeitada',
    agendado: 'agendado',
    inscrito: 'inscrito'
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
          ) : filtradas.map(s => (
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
                  {s.turma_nome && (
                    <p className={`text-xs mt-1 text-primary-500 font-medium`}>Turma pretendida: {s.turma_nome}</p>
                  )}
                  {(s.documentos || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.documentos.map((d, i) => (
                        d.url ? (
                          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:underline">
                            {d.nome || d.chave}
                          </a>
                        ) : (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-400">
                            {d.nome || d.chave}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                  {(s.formulario_respostas || []).length > 0 && (
                    <div className="mt-2">
                      <p className={`text-xs font-medium ${subtext} mb-1`}>Ficha de inscrição (preenchida no site):</p>
                      <div className="flex flex-wrap gap-1">
                        {s.formulario_respostas.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {f.label}: {f.valor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.comunicado_titulo && (
                    <p className="text-xs text-primary-500 mt-1">Comunicado: {s.comunicado_titulo}</p>
                  )}
                  <p className={`text-xs ${subtext} mt-1`}>
                    {new Date(s.created_at).toLocaleDateString('pt-AO')} {new Date(s.created_at).toLocaleTimeString('pt-AO')}
                  </p>
                </div>
                {s.estado === 'pendente' && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleAction(s.id, 'aceitar')} disabled={working === s.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                    </button>
                    <button onClick={() => handleAction(s.id, 'agendar')} disabled={working === s.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                      <Eye className="w-3.5 h-3.5" /> Agendar
                    </button>
                    <button onClick={() => handleAction(s.id, 'rejeitar')} disabled={working === s.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </div>
                )}
                {s.estado === 'aceite' && (
                  <button onClick={() => handleAction(s.id, 'inscrever')} disabled={working === s.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                    Inscrever
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesGestor;