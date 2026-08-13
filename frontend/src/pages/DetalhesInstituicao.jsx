import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Building2,
  Edit,
  UserCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Loading from '../components/Loading';
import StatusChip from '../components/StatusChip';
import StatsCard from '../components/StatsCard';
import { instituicaoService } from '../services/api';

const DetalhesInstituicao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instituicao, setInstituicao] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [instResponse, statsResponse] = await Promise.all([
        instituicaoService.getById(id),
        instituicaoService.getEstatisticas(id),
      ]);
      setInstituicao(instResponse.data);
      setEstatisticas(statsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!instituicao)
    return (
      <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        Instituição não encontrada
      </div>
    );

  const getTipoLabel = (tipo) => {
    const labels = {
      pre_escolar: 'Ensino Pré-Escolar',
      ensino_primario: 'Ensino Primário',
      ensino_medio: 'Ensino Médio',
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      pre_escolar: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      ensino_primario: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      ensino_medio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const vagasTotais = instituicao.vagas_totais || 0;
  const vagasDisponiveis = instituicao.vagas_disponiveis || 0;
  const vagasOcupadas = vagasTotais - vagasDisponiveis;
  const ocupacaoPercent = estatisticas?.ocupacao || 0;

  const getOcupacaoColor = (percent) => {
    if (percent > 95) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getOcupacaoTextColor = (percent) => {
    if (percent > 95) return 'text-red-500 dark:text-red-400';
    if (percent >= 70) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  const ocupacaoData = [
    {
      name: 'Ocupadas',
      value: vagasOcupadas,
      fill: '#6366f1',
    },
    {
      name: 'Disponíveis',
      value: vagasDisponiveis,
      fill: '#22c55e',
    },
  ];

  const hasEditPermission = true;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Voltar
      </button>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCA0MGw0MC00ME0tMTAgNTBsNjAgNjBNMzAgNTBsNjAgNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {instituicao.nome}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getTipoBadgeColor(
                  instituicao.tipo
                )}`}
              >
                {getTipoLabel(instituicao.tipo)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-indigo-100">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {instituicao.municipio_nome}, {instituicao.provincia_nome}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusChip status={instituicao.status} size="lg" />
            {hasEditPermission && (
              <button
                onClick={() => navigate(`/instituicoes/${id}/editar`)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-lg"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Telefone
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {instituicao.telefone || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Email
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {instituicao.email || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20">
                  <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Endereço
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {instituicao.endereco || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <UserCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Diretor
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {instituicao.diretor || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl bg-white p-6 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Distribuição de Vagas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ocupadas vs Disponíveis
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ocupacaoData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#f9fafb',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }}
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Vacancy Indicator */}
          <div className="rounded-xl bg-white p-6 shadow-card dark:bg-navy-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-6 text-center">
              <p
                className={`text-5xl font-extrabold tracking-tight ${getOcupacaoTextColor(
                  ocupacaoPercent
                )}`}
              >
                {ocupacaoPercent}%
              </p>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Taxa de Ocupação
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${getOcupacaoColor(
                  ocupacaoPercent
                )}`}
                style={{ width: `${Math.min(ocupacaoPercent, 100)}%` }}
              />
            </div>

            {/* Legend */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {vagasTotais}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Total
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {vagasOcupadas}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Ocupadas
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {vagasDisponiveis}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Disponíveis
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              icon={<Users className="w-5 h-5" />}
              label="Alunos"
              value={estatisticas?.total_alunos || 0}
              color="blue"
            />
            <StatsCard
              icon={<GraduationCap className="w-5 h-5" />}
              label="Professores"
              value={estatisticas?.total_professores || 0}
              color="emerald"
            />
            <StatsCard
              icon={<BookOpen className="w-5 h-5" />}
              label="Turmas"
              value={estatisticas?.total_turmas || 0}
              color="violet"
            />
            <StatsCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Vagas"
              value={vagasTotais}
              color="amber"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesInstituicao;
