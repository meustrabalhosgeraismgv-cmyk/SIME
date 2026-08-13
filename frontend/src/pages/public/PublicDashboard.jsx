import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  School, Users, GraduationCap, BookOpen, MapPin, Search,
  ArrowRight, Calendar, Megaphone, Star, AlertTriangle,
  Info, Settings, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { instituicaoService } from '../../services/api';
import MapaAngola from '../../components/MapaAngola';

export default function PublicDashboard() {
  const [escolas, setEscolas] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [stats, setStats] = useState({ escolas: 0, alunos: 0, professores: 0, vagas: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [escolasRes, statsRes] = await Promise.all([
          instituicaoService.getAll({ limit: 100 }),
          instituicaoService.getStats().catch(() => ({ data: { total: 0, alunos: 0, professores: 0, vagas: 0 } }))
        ]);

        const escolaData = escolasRes.data.data || [];
        setEscolas(escolaData);

        const s = statsRes.data;
        setStats({
          escolas: s.total || escolaData.length,
          alunos: s.alunos || 0,
          professores: s.professores || 0,
          vagas: s.vagas || 0,
        });

        const noticiasRes = await import('../../services/api').then(m => m.default.get('/noticias?limit=3'));
        setNoticias(noticiasRes.data.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getOcupacao = (totais, disponiveis) => {
    if (!totais) return 0;
    return ((totais - disponiveis) / totais * 100).toFixed(0);
  };

  const getVagasColor = (pct) => pct >= 95 ? '#F44336' : pct >= 70 ? '#FF9800' : '#4CAF50';
  const getVagasLabel = (pct) => pct >= 95 ? 'Lotada' : pct >= 70 ? 'Poucas vagas' : 'Disponível';

  const STATS = [
    { value: stats.escolas, label: 'Escolas Ativas', icon: School, color: '#0061a4' },
    { value: stats.alunos, label: 'Alunos', icon: Users, color: '#2b5bb5' },
    { value: stats.professores, label: 'Professores', icon: GraduationCap, color: '#904d00' },
    { value: stats.vagas, label: 'Vagas Disponíveis', icon: BookOpen, color: '#4CAF50' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Hero Section with Search */}
      <section className="relative overflow-hidden rounded-b-xl px-4 sm:px-8 py-20 flex flex-col items-center justify-center text-center min-h-[420px]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0061a4] via-[#0061a4] to-[#00497d]" />

        <div className="relative z-10 max-w-3xl w-full space-y-4">
          <span className="text-sm font-semibold text-[#d1e4ff] uppercase tracking-widest">República de Angola</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Bem-vindo ao Educa Mais+ Angola
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            O <strong>Sistema Integrado de Monitorização Escolar</strong> é a plataforma oficial de Angola para consulta de instituições de ensino, vagas disponíveis, calendário lectivo e processo de inscrição online.
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 w-full max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-6 text-gray-400 text-2xl" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por escola, curso ou município..."
                className="w-full h-16 pl-16 pr-32 rounded-full bg-white text-gray-900 shadow-xl focus:outline-none focus:ring-4 focus:ring-[#2196F3]/30 transition-all text-lg"
              />
              <Link
                to={searchQuery.trim() ? `/escolas?q=${encodeURIComponent(searchQuery)}` : '/escolas'}
                className="absolute right-2 h-12 px-8 bg-[#0061a4] hover:bg-[#00497d] text-white rounded-full font-semibold transition-colors"
              >
                Pesquisar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left: Map (60%) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Rede Escolar Nacional</h2>
                  <p className="text-sm text-gray-500">Mapa de distribuição e estado de ocupação</p>
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
              <div className="flex-1 relative">
                <MapaAngola escolas={escolas} onSelectEscola={(e) => navigate(`/escolas/${e.id}`)} />
              </div>
            </div>
          </div>

          {/* Right: Stats Panel (40%) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                       style={{ backgroundColor: stat.color + '15' }}>
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Featured Schools */}
            <div className="bg-white p-5 rounded-xl shadow-sm flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-[#0061a4]" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase">Escolas em Destaque</h3>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : escolas.length === 0 ? (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhuma escola registada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {escolas.slice(0, 4).map((escola) => {
                    const pct = getOcupacao(escola.vagas_totais, escola.vagas_disponiveis);
                    return (
                      <Link key={escola.id} to={`/escolas/${escola.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: getVagasColor(pct) + '15' }}>
                          <School className="w-5 h-5" style={{ color: getVagasColor(pct) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0061a4]">{escola.nome}</p>
                          <p className="text-xs text-gray-500">{escola.municipio_nome}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0061a4] group-hover:translate-x-1 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link to="/escolas" className="mt-4 w-full py-2 text-sm font-semibold text-[#0061a4] hover:bg-blue-50 rounded-lg border border-[#2196F3] transition-all flex items-center justify-center gap-2">
                Ver Todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* School Carousel */}
        {escolas.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-[#0061a4]" />
                <h3 className="text-lg font-semibold text-gray-900">Escolas na Rede</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollCarousel(-1)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => scrollCarousel(1)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {escolas.map((escola) => {
                const pct = getOcupacao(escola.vagas_totais, escola.vagas_disponiveis);
                const tipoCores = {
                  pre_escolar: { bg: 'from-pink-500 to-rose-400', icon: 'bg-pink-100' },
                  ensino_primario: { bg: 'from-blue-500 to-blue-400', icon: 'bg-blue-100' },
                  ensino_medio: { bg: 'from-green-500 to-emerald-400', icon: 'bg-green-100' },
                };
                const tc = tipoCores[escola.tipo] || tipoCores.ensino_medio;
                const tipoLabel = escola.tipo === 'pre_escolar' ? 'Pré-Escolar' :
                  escola.tipo === 'ensino_primario' ? 'Primário' :
                  escola.tipo === 'ensino_medio' ? 'Médio' : escola.tipo;

                return (
                  <Link key={escola.id} to={`/escolas/${escola.id}`}
                    className="flex-shrink-0 w-[280px] snap-start bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100 group">
                    <div className={`h-32 bg-gradient-to-br ${tc.bg} relative flex items-center justify-center`}>
                      <School className="w-12 h-12 text-white/80" />
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                        {tipoLabel}
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90 text-xs">
                        <MapPin className="w-3 h-3" />
                        {escola.municipio_nome}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-[#0061a4] transition-colors line-clamp-2 min-h-[40px]">
                        {escola.nome}
                      </h4>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all"
                              style={{ width: `${100 - pct}%`, backgroundColor: getVagasColor(pct) }} />
                          </div>
                        </div>
                        <span className="ml-2 text-xs font-medium" style={{ color: getVagasColor(pct) }}>
                          {escola.vagas_disponiveis || 0} vagas
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* News Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#0061a4]" />
              <h3 className="text-lg font-semibold text-gray-900">Últimas Notícias</h3>
            </div>
            <Link to="/noticias" className="text-sm font-semibold text-[#0061a4] hover:underline">
              Ver todas
            </Link>
          </div>
          {noticias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {noticias.map((noticia) => (
                <Link key={noticia.id} to="/noticias"
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 group">
                  <div className="p-5">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-3 ${
                      noticia.categoria === 'aviso' ? 'bg-amber-50 text-amber-700' :
                      noticia.categoria === 'evento' ? 'bg-green-50 text-green-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {noticia.categoria}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#0061a4] transition-colors line-clamp-2">
                      {noticia.titulo}
                    </h4>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{noticia.resumo}</p>
                    <p className="text-xs text-gray-400 mt-3">{new Date(noticia.created_at).toLocaleDateString('pt-AO')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma notícia publicada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
