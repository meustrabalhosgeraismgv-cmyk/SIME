import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, BarChart3, ClipboardList, Calendar, MapPin,
  Newspaper, ArrowRight, Phone, Mail, School, Users,
  GraduationCap, BookOpen, Building2
} from 'lucide-react';
import { instituicaoService } from '../../services/api';
import Logo from '../../components/Logo';

const FEATURES = [
  { icon: Search, title: 'Pesquisar Escolas', desc: 'Encontre escolas por nome, município ou tipo de ensino', color: '#0061a4' },
  { icon: BarChart3, title: 'Consultar Vagas', desc: 'Veja a disponibilidade de vagas em tempo real', color: '#4CAF50' },
  { icon: ClipboardList, title: 'Matrículas Online', desc: 'Inicie o processo de matrícula de forma rápida e simples', color: '#FF9800' },
  { icon: Calendar, title: 'Calendário Escolar', desc: 'Consulte datas importantes do ano lectivo', color: '#2b5bb5' },
  { icon: Newspaper, title: 'Notícias', desc: 'Acompanhe as novidades do sistema educacional', color: '#904d00' },
  { icon: MapPin, title: 'Mapa Interactivo', desc: 'Explore as escolas no mapa da província', color: '#F44336' },
];

export default function LandingPage() {
  const [escolas, setEscolas] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    instituicaoService.getAll({ limit: 6 }).then(r => setEscolas(r.data.data || [])).catch(() => {});
    import('../../services/api').then(({ default: api }) => {
      api.get('/noticias?limit=3').then(r => setNoticias(r.data.data || [])).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/escolas?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getOcupacao = (totais, disponiveis) => {
    if (!totais) return 0;
    return ((totais - disponiveis) / totais * 100).toFixed(0);
  };

  const getVagasColor = (pct) => pct >= 95 ? '#F44336' : pct >= 70 ? '#FF9800' : '#4CAF50';
  const getVagasLabel = (pct) => pct >= 95 ? 'Lotada' : pct >= 70 ? 'Poucas vagas' : 'Disponível';

  const STATS = [
    { value: escolas.length || 5, label: 'Escolas', icon: School },
    { value: '1.133', label: 'Alunos', icon: Users },
    { value: '5', label: 'Professores', icon: GraduationCap },
    { value: '1.400', label: 'Vagas', icon: BookOpen },
  ];

  const catBadge = (cat) => {
    const m = { geral: 'bg-gray-100 text-gray-700', educacao: 'bg-blue-50 text-blue-700', aviso: 'bg-amber-50 text-amber-700', evento: 'bg-green-50 text-green-700', edital: 'bg-purple-50 text-purple-700', circular: 'bg-red-50 text-red-700' };
    return m[cat] || m.geral;
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0061a4]">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 600" fill="none">
            <circle cx="200" cy="300" r="300" stroke="white" strokeWidth="0.5"/>
            <circle cx="1200" cy="200" r="250" stroke="white" strokeWidth="0.5"/>
            <circle cx="700" cy="500" r="200" stroke="white" strokeWidth="0.5"/>
            <path d="M0 400 Q360 300 720 350 T1440 250" stroke="white" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#759efd]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0061a4]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-sm text-white/90 font-medium">Província do Huambo — Angola</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Toda a informação escolar<br />
            <span className="text-white/90">num só lugar</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Encontre escolas, consulte vagas, acompanhe notícias e inicie matrículas 
            de forma simples e gratuita.
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-full shadow-xl overflow-hidden">
              <Search className="w-5 h-5 text-gray-400 ml-6 my-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar escolas por nome, município ou código..."
                className="flex-1 px-4 py-4 text-gray-900 text-base focus:outline-none"
              />
              <button type="submit" className="px-8 py-4 bg-[#0061a4] hover:bg-[#00497d] text-white font-semibold transition-colors rounded-r-full">
                Pesquisar
              </button>
            </div>
          </form>
          <div className="flex items-center justify-center gap-6 mt-8 text-white/70 text-sm">
            <span className="flex items-center gap-1.5"><School className="w-4 h-4" /> 5 escolas</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 1.133 alunos</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> 1.400 vagas</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#0061a4]/10">
                  <s.icon className="w-7 h-7 text-[#0061a4]" />
                </div>
                <p className="text-3xl font-bold text-[#0061a4]">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0061a4]">Como funciona o SIME</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Uma plataforma completa para o sistema educacional da província do Huambo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Link key={i} to={i === 0 ? '/escolas' : i === 1 ? '/escolas' : i === 3 ? '/calendario' : i === 4 ? '/noticias' : i === 5 ? '/escolas' : '/login'}
                className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                     style={{ backgroundColor: f.color + '15' }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Schools Preview */}
      {escolas.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0061a4]">Escolas em destaque</h2>
                <p className="text-gray-500 mt-2">Instituições de ensino da província do Huambo</p>
              </div>
              <Link to="/escolas" className="hidden md:flex items-center gap-2 text-[#0061a4] font-semibold hover:underline">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {escolas.slice(0, 3).map((escola) => {
                const pct = getOcupacao(escola.vagas_totais, escola.vagas_disponiveis);
                return (
                  <Link key={escola.id} to={`/escolas/${escola.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg overflow-hidden transition-all duration-300">
                    <div className="h-2" style={{ backgroundColor: getVagasColor(pct) }}></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-[#0061a4] transition-colors line-clamp-1">{escola.nome}</h3>
                          <p className="text-sm text-gray-500 mt-1">{escola.municipio_nome}</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0061a4]/10 text-[#0061a4]">
                          {escola.tipo === 'pre_escolar' ? 'Pré-Escolar' : escola.tipo === 'ensino_primario' ? 'Primário' : escola.tipo === 'ensino_medio' ? 'Médio' : escola.tipo === 'ensino_superior' ? 'Superior' : escola.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{escola.municipio_nome}</span>
                        {escola.vagas_disponiveis > 0 && (
                          <span className="flex items-center gap-1" style={{ color: getVagasColor(pct) }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getVagasColor(pct) }}></span>
                            {getVagasLabel(pct)}
                          </span>
                        )}
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Vagas disponíveis</span>
                          <span className="font-bold" style={{ color: getVagasColor(pct) }}>{escola.vagas_disponiveis} / {escola.vagas_totais}</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: getVagasColor(pct) }}></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to="/escolas" className="inline-flex items-center gap-2 text-[#0061a4] font-semibold">
                Ver todas as escolas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* News */}
      {noticias.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0061a4]">Últimas notícias</h2>
                <p className="text-gray-500 mt-2">Fique a par das novidades do sistema educacional</p>
              </div>
              <Link to="/noticias" className="hidden md:flex items-center gap-2 text-[#0061a4] font-semibold hover:underline">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {noticias.map((n) => (
                <Link key={n.id} to="/noticias"
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg p-6 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catBadge(n.categoria)}`}>{n.categoria}</span>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('pt-AO')}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-[#0061a4] transition-colors mb-2 line-clamp-2">{n.titulo}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">{n.resumo}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-[#0061a4]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Encontre a escola ideal para o seu filho</h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Pesquise por escolas na sua região, consulte vagas disponíveis e inicie o processo de matrícula online.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/escolas" className="px-8 py-3.5 bg-white text-[#0061a4] font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
              Pesquisar Escolas
            </Link>
            <Link to="/calendario" className="px-8 py-3.5 bg-white/15 text-white font-bold rounded-xl hover:bg-white/25 transition-colors border border-white/30">
              Calendário Escolar
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <Logo size="small" className="mb-4" />
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                Plataforma integrada de informação educacional da Província do Huambo, Angola.
                Digitalizando, organizando e centralizando toda a informação escolar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Navegação</h4>
              <div className="space-y-2.5">
                <Link to="/escolas" className="block text-gray-500 hover:text-[#0061a4] text-sm transition-colors">Escolas</Link>
                <Link to="/noticias" className="block text-gray-500 hover:text-[#0061a4] text-sm transition-colors">Notícias</Link>
                <Link to="/calendario" className="block text-gray-500 hover:text-[#0061a4] text-sm transition-colors">Calendário</Link>
                <Link to="/login" className="block text-gray-500 hover:text-[#0061a4] text-sm transition-colors">Área Restrita</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Contactos</h4>
              <div className="space-y-2.5 text-sm text-gray-500">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +244 241 234 567</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@sime.gov.ao</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Huambo, Angola</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>© 2026 SIME — Governo Provincial do Huambo</p>
            <p className="mt-2 md:mt-0">Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
