import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Activity, Clock, CheckCircle, XCircle, Calendar, BookOpen, Loader2,
  Search, TrendingUp, RefreshCw, Bell, Phone, School, Filter, HeartHandshake
} from 'lucide-react';
import Loading from '../components/Loading';
import { solicitacaoService } from '../services/api';
import { connectSocket, getSocket } from '../services/socketClient';

const ESTADOS = [
  { key: 'pendente', label: 'Em Análise', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', pulse: 'ring-amber-400' },
  { key: 'aceite', label: 'Aceite', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', chip: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400', pulse: 'ring-green-400' },
  { key: 'agendado', label: 'Agendado', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', pulse: 'ring-blue-400' },
  { key: 'rejeitada', label: 'Recusada', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', chip: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400', pulse: 'ring-red-400' },
  { key: 'inscrito', label: 'Inscrito', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', chip: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', pulse: 'ring-purple-400' },
];

const MercadoVagas = () => {
  const { theme } = useTheme();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendente: 0, aceite: 0, agendado: 0, rejeitada: 0, inscrito: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await solicitacaoService.getAdmin({ estado: filtro, search });
      setSolicitacoes(res.data.data || []);
      setStats(res.data.stats || {});
    } catch (e) {
      console.error('Erro ao carregar mercado de vagas:', e);
    } finally {
      setLoading(false);
    }
  }, [filtro, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const token = localStorage.getItem('sime_token');
    const socket = connectSocket(token);
    const onNovo = (p) => {
      setSolicitacoes(prev => [p, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, pendente: prev.pendente + 1 }));
      pushAlert('nova', p, 'Nova solicitação recebida');
    };
    const onUpdate = (p) => {
      setSolicitacoes(prev => {
        const exists = prev.some(s => s.id === p.id);
        return exists ? prev.map(s => s.id === p.id ? p : s) : [p, ...prev];
      });
      pushAlert('mudanca', p, `Solicitação ${ESTADOS.find(e => e.key === p.estado)?.label || p.estado}`);
      refreshStats();
    };
    const onMatricula = (p) => {
      pushAlert('matricula', p, 'Nova matrícula registada');
      refreshStats();
    };
    socket?.on('solicitacao:novo', onNovo);
    socket?.on('solicitacao:update', onUpdate);
    socket?.on('matricula:novo', onMatricula);
    return () => {
      socket?.off('solicitacao:novo', onNovo);
      socket?.off('solicitacao:update', onUpdate);
      socket?.off('matricula:novo', onMatricula);
      if (getSocket()) getSocket().disconnect();
    };
  }, []);

  const refreshStats = () => {
    solicitacaoService.getAdmin({}).then(res => setStats(res.data.stats || {})).catch(() => {});
  };

  const pushAlert = (tipo, p, texto) => {
    const alert = {
      id: Date.now() + Math.random(),
      tipo, texto,
      aluno: p?.aluno_nome || p?.aluno || '',
      instituicao: p?.instituicao_nome || '',
      estado: p?.estado,
      time: new Date().toLocaleTimeString('pt-AO'),
      destacado: true
    };
    setAlerts(prev => [alert, ...prev].slice(0, 30));
    setTimeout(() => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, destacado: false } : a));
    }, 6000);
    if (soundOn && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const configOf = (estado) => ESTADOS.find(e => e.key === estado) || ESTADOS[0];

  const filtered = solicitacoes;

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const statCards = [
    { key: 'total', label: 'Total de Solicitações', icon: Activity, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { key: 'pendente', label: 'Em Análise', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { key: 'aceite', label: 'Aceites', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { key: 'rejeitada', label: 'Recusadas', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { key: 'inscrito', label: 'Inscritos', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hidden beep */}
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRl9vTUFXZ3pzdHMgAwFBRUVFQUlJSUFBUUFBQUVBRUVBQUFBQUFBQUFBQUFBQUFBRUVFQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB" preload="auto" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Mercado de Vagas</h1>
              <p className={`text-sm ${subtext}`}>Painel em tempo real de solicitações e matrículas em todo o país</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}
            >
              <Bell className="w-4 h-4" /> Som {soundOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={load} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={`${card} border rounded-2xl p-5`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className={`text-3xl font-bold ${text}`}>{stats[s.key] ?? 0}</p>
                <p className={`text-xs ${subtext}`}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Alerts feed */}
        {alerts.length > 0 && (
          <div className={`${card} border rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${alerts.some(a => a.destacado) ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <h3 className={`text-sm font-semibold ${text}`}>Atividade Recente (tempo real)</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {alerts.map(a => {
                const c = configOf(a.estado);
                const CIcon = c.icon;
                return (
                  <div key={a.id} className={`flex-shrink-0 w-72 p-3 rounded-xl border ${card} ${a.destacado ? `ring-2 ${c.pulse} animate-pulse` : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${c.bg}`}><CIcon className={`w-3.5 h-3.5 ${c.color}`} /></span>
                      <span className="text-[11px] font-semibold text-primary-500 uppercase">{a.texto}</span>
                      <span className="ml-auto text-[10px] text-gray-400">{a.time}</span>
                    </div>
                    <p className={`text-xs font-semibold ${text} mt-1.5 truncate`}>{a.aluno}</p>
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <School className="w-3 h-3" /> {a.instituicao || '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${card} flex-1`}>
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por nome do aluno ou BI..."
              className={`bg-transparent outline-none text-sm w-full ${text}`}
            />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${card}`}>
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className={`bg-transparent outline-none text-sm ${text}`}>
              <option value="">Todos os estados</option>
              {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <Loading text="A carregar o mercado de vagas..." />
        ) : (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${text}`}>Solicitações ({filtered.length})</h2>
            </div>
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className={subtext}>Nenhuma solicitação encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-navy-700' : 'border-gray-200'}`}>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Estado</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Aluno</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Encarregado</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Instituição</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Pedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const c = configOf(s.estado);
                      const CIcon = c.icon;
                      return (
                        <tr key={s.id} className={`border-b ${theme === 'dark' ? 'border-navy-700' : 'border-gray-100'} hover:bg-gray-50 dark:hover:bg-navy-700/40`}>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.chip}`}>
                              <CIcon className="w-3.5 h-3.5" /> {c.label}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <p className={`font-medium ${text}`}>{s.aluno_nome}</p>
                            <p className={`text-xs ${subtext}`}>{s.aluno_bi || '—'}</p>
                            {s.necessidades_especiais && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-purple-500">
                                <HeartHandshake className="w-3 h-3" /> {s.necessidades_especiais}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <p className={text}>{s.encarregado_nome || '—'}</p>
                            {s.encarregado_telefone && (
                              <p className={`text-xs ${subtext} flex items-center gap-1`}>
                                <Phone className="w-3 h-3" /> {s.encarregado_telefone}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <p className={`font-medium ${text}`}>{s.instituicao_nome || '—'}</p>
                            <p className={`text-xs ${subtext}`}>{s.instituicao_municipio || ''} {s.instituicao_tipo ? `• ${s.instituicao_tipo}` : ''}</p>
                          </td>
                          <td className="px-6 py-3">
                            <p className={`text-xs ${subtext}`}>{new Date(s.created_at).toLocaleString('pt-AO')}</p>
                            {s.curso_nome && <p className={`text-xs font-medium ${text}`}>{s.curso_nome}</p>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MercadoVagas;