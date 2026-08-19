import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, Users, GraduationCap, BookOpen, TrendingUp, AlertTriangle,
  Clock, MapPin, Calendar, Search, ChevronRight, Bell, BarChart3,
  Sparkles, FileText, ClipboardList, Eye, ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import StatsCard from '../components/StatsCard';
import Loading from '../components/Loading';
import MapaAngola from '../components/MapaAngola';
import { dashboardService, instituicaoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, escolasRes] = await Promise.all([
        dashboardService.getStats(),
        instituicaoService.getAll({ limit: 50 })
      ]);
      setStats(statsRes.data);
      setEscolas(escolasRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="A carregar painel de controlo..." />;

  const escolasPorTipo = stats?.instituicoes_por_tipo?.map(item => ({
    name: item.tipo === 'pre_escolar' ? 'Pré-Escolar' : item.tipo === 'ensino_primario' ? 'Primário' : item.tipo === 'ensino_medio' ? 'Médio' : item.tipo,
    value: item.total
  })) || [];

  const vagasData = [
    { name: 'Ocupadas', value: stats?.vagas?.vagas_ocupadas || 0, fill: '#2196F3' },
    { name: 'Disponiveis', value: stats?.vagas?.vagas_disponiveis || 0, fill: '#4CAF50' }
  ];

  const matriculasData = [
    { name: 'Jan', total: 1200 }, { name: 'Fev', total: 1350 }, { name: 'Mar', total: 1500 },
    { name: 'Abr', total: 1650 }, { name: 'Mai', total: 1800 }, { name: 'Jun', total: 1950 }
  ];

  const escolasBarData = [
    { name: 'ES Luanda', ocupadas: 560, disponiveis: 240 },
    { name: 'EP Centro', ocupadas: 420, disponiveis: 180 },
    { name: 'IT Benguela', ocupadas: 280, disponiveis: 120 },
    { name: 'ES Huambo', ocupadas: 490, disponiveis: 210 },
    { name: 'EP Lubango', ocupadas: 350, disponiveis: 150 }
  ];

  const calendarEvents = [
    { date: '15/09', title: 'Inicio das aulas', type: 'info' },
    { date: '20/10', title: '1o Periodo', type: 'event' },
    { date: '15/12', title: 'Ferias', type: 'warning' },
    { date: '05/01', title: 'Regresso', type: 'info' },
  ];

  const quickActions = [
    { icon: Search, label: 'Pesquisar Escolas', path: '/app/pesquisar-escolas', color: 'bg-primary-500' },
    { icon: ClipboardList, label: 'Nova Matricula', path: '/app/matriculas', color: 'bg-success-500' },
    { icon: BarChart3, label: 'Estatisticas', path: '/app/estatisticas', color: 'bg-warning-500' },
    { icon: FileText, label: 'Relatorios', path: '/app/relatorios', color: 'bg-navy-600' },
  ];

  const perfilLabels = {
    admin: 'Administrador', ministerio: 'Ministerio da Educacao',
    diretor: 'Director Escolar', professor: 'Professor', encarregado: 'Encarregado de Educacao'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-navy-800 px-4 py-3 rounded-xl shadow-float border border-gray-100 dark:border-navy-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: <span className="font-medium text-gray-900 dark:text-white">{entry.value?.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            Boas-vindas, {user?.username}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {perfilLabels[user?.perfil] || 'Painel de controlo'} — Visao geral do sistema educativo
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); navigate('/app/pesquisar-escolas?search=' + searchQuery); }}>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar escolas, municipios, codigo..."
              className="w-full pl-12 pr-32 py-3.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-5 py-2 text-sm">
              Pesquisar
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button key={action.label} onClick={() => navigate(action.path)}
            className="card card-hover flex items-center gap-3 p-4 text-left group">
            <div className={`p-2.5 ${action.color} rounded-xl text-white group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={School} title="Total de Escolas" value={stats?.resumo?.total_instituicoes || 0} trend="up" trendValue="+5%" color="primary" />
        <StatsCard icon={Users} title="Total de Alunos" value={stats?.resumo?.total_alunos?.toLocaleString() || '0'} trend="up" trendValue="+12%" color="success" />
        <StatsCard icon={GraduationCap} title="Total de Professores" value={stats?.resumo?.total_professores || 0} trend="up" trendValue="+3%" color="warning" />
        <StatsCard icon={BookOpen} title="Vagas Disponiveis" value={stats?.vagas?.vagas_disponiveis || 0} color="error" subtitle={`${stats?.vagas?.total_vagas || 0} vagas totais`} />
      </div>

      {/* Mapa Rede Escolar */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-navy-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rede Escolar Provincial</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mapa de distribuição e estado de ocupação</p>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-sm font-medium text-[#4CAF50]">
              <span className="w-3 h-3 rounded-full bg-[#4CAF50]"></span> Vagas
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-[#FF9800]">
              <span className="w-3 h-3 rounded-full bg-[#FF9800]"></span> Limitado
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-[#F44336]">
              <span className="w-3 h-3 rounded-full bg-[#F44336]"></span> Lotado
            </span>
          </div>
        </div>
        <div style={{ height: '500px' }} className="relative">
          <MapaAngola escolas={escolas} onSelectEscola={(e) => navigate(`/escolas/${e._id || e.id}`)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="space-y-6">
          {/* Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-warning-500" /> Alertas
              </h3>
              <span className="badge bg-error-500 text-white">{stats?.alertas_recentes?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {stats?.alertas_recentes?.slice(0, 4).map((alerta, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-navy-800 rounded-xl">
                  <div className={`p-1.5 rounded-lg ${
                    alerta.tipo === 'sucesso' ? 'bg-success-100 dark:bg-success-500/10' :
                    alerta.tipo === 'aviso' ? 'bg-warning-100 dark:bg-warning-500/10' :
                    'bg-primary-100 dark:bg-primary-500/10'
                  }`}>
                    {alerta.tipo === 'sucesso' ? <TrendingUp className="w-3.5 h-3.5 text-success-600 dark:text-success-400" /> :
                     alerta.tipo === 'aviso' ? <AlertTriangle className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" /> :
                     <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{alerta.titulo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{alerta.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-500" /> Calendario
            </h3>
            <div className="space-y-3">
              {calendarEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-navy-800 rounded-lg">
                  <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                    event.type === 'info' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' :
                    event.type === 'event' ? 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400' :
                    'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                  }`}>{event.date}</div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evolucao de Matriculas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={matriculasData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#2196F3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="Matriculas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Escolas por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={escolasPorTipo} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                {escolasPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {escolasPorTipo.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart + Vagas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vagas por Instituicao</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={escolasBarData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ocupadas" fill="#2196F3" name="Ocupadas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="disponiveis" fill="#4CAF50" name="Disponiveis" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ocupacao de Vagas</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={vagasData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {vagasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-4">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.vagas?.total_vagas || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Vagas</p>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary-500">{stats?.vagas?.vagas_ocupadas || 0}</p>
              <p className="text-xs text-gray-500">Ocupadas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-success-500">{stats?.vagas?.vagas_disponiveis || 0}</p>
              <p className="text-xs text-gray-500">Disponiveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ultimas Matriculas</h3>
          <button onClick={() => navigate('/app/matriculas')} className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats?.ultimas_matriculas?.slice(0, 6).map((matricula, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-800 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{matricula.aluno_nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{matricula.turma_nome}</p>
              </div>
              <span className="status-chip bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400 text-[10px]">
                {matricula.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
