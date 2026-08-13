import { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  School,
  Users,
  GraduationCap,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import Loading from '../components/Loading';
import StatsCard from '../components/StatsCard';
import { dashboardService } from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const COLORS_DARK = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-4 py-3 text-sm">
      {label && (
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      )}
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium text-gray-900 dark:text-white ml-auto">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString('pt-MZ')
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const ExportButton = ({ icon: Icon, label, variant = 'default', onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
      ${
        variant === 'pdf'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 ring-1 ring-red-500/10'
          : variant === 'excel'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 ring-1 ring-emerald-500/10'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const Estatisticas = () => {
  const [stats, setStats] = useState(null);
  const [provinciaStats, setProvinciaStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, provinciaResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getProvincia()
      ]);
      setStats(statsResponse.data);
      setProvinciaStats(provinciaResponse.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      // TODO: implement PDF export
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      // TODO: implement Excel export
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) return <Loading />;

  const escolasPorTipo = stats?.instituicoes_por_tipo?.map(item => ({
    name: item.tipo === 'pre_escolar' ? 'Pré-Escolar' :
           item.tipo === 'ensino_primario' ? 'Primário' :
           item.tipo === 'ensino_medio' ? 'Médio' :
           item.tipo,
    value: item.total
  })) || [];

  const alunosPorGenero = stats?.alunos_por_genero?.map(item => ({
    name: item.sexo === 'M' ? 'Masculino' : 'Feminino',
    value: item.total
  })) || [];

  const dadosProvincia = provinciaStats.map(p => ({
    name: p.provincia,
    escolas: p.total_instituicoes || 0,
    alunos: p.total_alunos || 0,
    professores: p.total_professores || 0
  }));

  const vagasData = [
    { name: 'Ocupadas', value: stats?.vagas?.vagas_ocupadas || 0 },
    { name: 'Disponíveis', value: stats?.vagas?.vagas_disponiveis || 0 }
  ];

  const trendData = [
    { name: 'Jan', matriculas: 1200, alunos: 8500 },
    { name: 'Fev', matriculas: 1350, alunos: 8700 },
    { name: 'Mar', matriculas: 1500, alunos: 8900 },
    { name: 'Abr', matriculas: 1650, alunos: 9100 },
    { name: 'Mai', matriculas: 1800, alunos: 9300 },
    { name: 'Jun', matriculas: 1950, alunos: 9500 }
  ];

  const matriculaTrend = [
    { name: 'Jan', matriculas: 1200 },
    { name: 'Fev', matriculas: 1350 },
    { name: 'Mar', matriculas: 1500 },
    { name: 'Abr', matriculas: 1650 },
    { name: 'Mai', matriculas: 1800 },
    { name: 'Jun', matriculas: 1950 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estatísticas</h2>
          <p className="text-gray-500 dark:text-gray-400">Análise detalhada do sistema educativo</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            icon={exportingPdf ? Loader2 : FileText}
            label={exportingPdf ? 'Exportando...' : 'PDF'}
            variant="pdf"
            onClick={handleExportPdf}
          />
          <ExportButton
            icon={exportingExcel ? Loader2 : FileSpreadsheet}
            label={exportingExcel ? 'Exportando...' : 'Excel'}
            variant="excel"
            onClick={handleExportExcel}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-5 ring-1 ring-blue-500/10 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <School className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Escolas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.resumo?.total_instituicoes?.toLocaleString('pt-MZ') || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-5 ring-1 ring-emerald-500/10 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Alunos</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.resumo?.total_alunos?.toLocaleString('pt-MZ') || '0'}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-5 ring-1 ring-amber-500/10 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Professores</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.resumo?.total_professores?.toLocaleString('pt-MZ') || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-5 ring-1 ring-violet-500/10 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Turmas Ativas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.resumo?.total_turmas?.toLocaleString('pt-MZ') || 0}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escolas por Tipo */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Escolas por Tipo
          </h3>
          <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={escolasPorTipo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#3B82F6"
                  name="Quantidade"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alunos por Género */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            Alunos por Género
          </h3>
          <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alunosPorGenero}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {alunosPorGenero.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13 }}
                  formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evolução Mensal - Line Chart */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          Evolução Mensal ({new Date().getFullYear()})
        </h3>
        <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13 }}
                formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="matriculas"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Matrículas"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="alunos"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Total Alunos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas por Província */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-500" />
            Estatísticas por Província
          </h3>
          <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosProvincia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13 }}
                  formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
                />
                <Bar
                  dataKey="escolas"
                  fill="#3B82F6"
                  name="Escolas"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="alunos"
                  fill="#10B981"
                  name="Alunos"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="professores"
                  fill="#F59E0B"
                  name="Professores"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ocupação de Vagas */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-amber-500" />
            Ocupação de Vagas
          </h3>
          <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vagasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {vagasData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13 }}
                  formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(stats?.vagas?.total_vagas || 0).toLocaleString('pt-MZ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Vagas</p>
          </div>
        </div>
      </div>

      {/* Matrículas Area Chart */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Tendência de Matrículas
        </h3>
        <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={matriculaTrend}>
              <defs>
                <linearGradient id="matriculasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="matriculas"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#matriculasGradient)"
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Matrículas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 ring-1 ring-gray-900/5 dark:ring-white/5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-navy-800 rounded-xl ring-1 ring-blue-500/10">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(stats?.resumo?.total_instituicoes || 0).toLocaleString('pt-MZ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Instituições</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-navy-800 rounded-xl ring-1 ring-emerald-500/10">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(stats?.resumo?.total_alunos || 0).toLocaleString('pt-MZ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Alunos Matriculados</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-navy-800 rounded-xl ring-1 ring-amber-500/10">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {(stats?.resumo?.total_professores || 0).toLocaleString('pt-MZ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Professores</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-navy-800 rounded-xl ring-1 ring-red-500/10">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {(stats?.vagas?.vagas_disponiveis || 0).toLocaleString('pt-MZ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vagas Disponíveis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estatisticas;
