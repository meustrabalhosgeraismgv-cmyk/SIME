import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Phone, Users, ChevronRight, ChevronLeft, Filter, School, GraduationCap, Building2 } from 'lucide-react';
import Loading from '../components/Loading';
import StatusChip from '../components/StatusChip';
import { instituicaoService } from '../services/api';

function EscolaBanner({ escola }) {
  const gradient = escola.tipo === 'pre_escolar'
    ? 'from-amber-400 to-orange-500'
    : escola.tipo === 'ensino_primario'
      ? 'from-primary-500 to-blue-600'
      : 'from-success-500 to-emerald-600';

  const tipoLabel = escola.tipo === 'pre_escolar' ? 'Pré-Escolar'
    : escola.tipo === 'ensino_primario' ? 'Ensino Primário'
    : escola.tipo === 'ensino_medio' ? 'Ensino Médio' : escola.tipo;

  if (escola.imagem_url) {
    return (
      <div className="relative -mx-6 -mt-6 mb-4 h-44 overflow-hidden">
        <img src={escola.imagem_url} alt={escola.nome} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className="status-chip bg-white/90 text-gray-800 text-xs">{tipoLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative -mx-6 -mt-6 mb-4 h-44 overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 gap-2">
        <Building2 className="w-10 h-10" />
        <span className="font-semibold text-sm uppercase tracking-wider">{tipoLabel}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

const PesquisarEscolas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [tipo, setTipo] = useState('');
  const [statusVagas, setStatusVagas] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => { loadEscolas(); }, [pagination.page, tipo, statusVagas]);

  const loadEscolas = async () => {
    try {
      setLoading(true);
      const response = await instituicaoService.getAll({
        search, tipo, page: pagination.page, limit: 9
      });
      setEscolas(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadEscolas();
  };

  const getTipoLabel = (tipo) => ({
    pre_escolar: 'Ensino Pré-Escolar',
    ensino_primario: 'Ensino Primário',
    ensino_medio: 'Ensino Médio',
  }[tipo] || tipo);

  const getOcupacaoPercent = (vagasTotais, vagasDisponiveis) => {
    if (!vagasTotais) return 0;
    return ((vagasTotais - vagasDisponiveis) / vagasTotais * 100).toFixed(1);
  };

  const getVagasStatus = (escola) => {
    const pct = getOcupacaoPercent(escola.vagas_totais, escola.vagas_disponiveis);
    if (pct >= 95) return { label: 'Lotada', color: 'error', dot: 'bg-error-500' };
    if (pct >= 70) return { label: 'Poucas vagas', color: 'warning', dot: 'bg-warning-500' };
    return { label: 'Disponivel', color: 'success', dot: 'bg-success-500' };
  };

  const filteredEscolas = escolas.filter(e => {
    if (statusVagas === 'disponivel') return getOcupacaoPercent(e.vagas_totais, e.vagas_disponiveis) < 70;
    if (statusVagas === 'poucas') return getOcupacaoPercent(e.vagas_totais, e.vagas_disponiveis) >= 70 && getOcupacaoPercent(e.vagas_totais, e.vagas_disponiveis) < 95;
    if (statusVagas === 'lotada') return getOcupacaoPercent(e.vagas_totais, e.vagas_disponiveis) >= 95;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-primary-500" />
          Pesquisar Escolas
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Encontre instituicoes de ensino em Angola</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome da escola, director, municipio, codigo..."
                className="input-field pl-11" />
            </div>
            <button type="submit" className="btn-primary">Pesquisar</button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtros:</span>
            </div>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="select-field w-auto min-w-[160px]">
              <option value="">Todos os tipos</option>
              <option value="pre_escolar">Pré-Escolar</option>
              <option value="ensino_primario">Primário</option>
              <option value="ensino_medio">Médio</option>
            </select>
            <select value={statusVagas} onChange={(e) => setStatusVagas(e.target.value)} className="select-field w-auto min-w-[160px]">
              <option value="">Todas as vagas</option>
              <option value="disponivel">Disponivel</option>
              <option value="poucas">Poucas vagas</option>
              <option value="lotada">Lotada</option>
            </select>
          </div>
        </form>
      </div>

      {loading ? (
        <Loading text="A pesquisar escolas..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEscolas.map((escola) => {
              const vagasStatus = getVagasStatus(escola);
              const ocupacaoPct = getOcupacaoPercent(escola.vagas_totais, escola.vagas_disponiveis);
              return (
                <div key={escola.id} className="card card-hover cursor-pointer group"
                  onClick={() => navigate('/app/instituicoes/' + escola.id)}>
                  <EscolaBanner escola={escola} />

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-2">
                        {escola.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`status-chip text-[10px] ${
                          escola.tipo === 'ensino_primario' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' :
                          escola.tipo === 'ensino_medio' ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' :
                          'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'
                        }`}>{getTipoLabel(escola.tipo)}</span>
                        <StatusChip status={escola.status} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{escola.municipio_nome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{escola.responsavel || escola.diretor || '—'}</span>
                    </div>
                    {escola.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{escola.telefone}</span>
                      </div>
                    )}
                  </div>

                  {/* Vacancy Indicator */}
                  <div className="pt-3 border-t border-gray-100 dark:border-navy-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${vagasStatus.dot}`}></span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{vagasStatus.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {escola.vagas_disponiveis}/{escola.vagas_totais}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{
                        width: ocupacaoPct + '%',
                        backgroundColor: vagasStatus.color === 'error' ? '#F44336' :
                                        vagasStatus.color === 'warning' ? '#FF9800' : '#4CAF50'
                      }}></div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 text-right">{ocupacaoPct}% ocupacao</p>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-primary-500 text-sm font-medium group-hover:gap-2 transition-all">
                    Ver detalhes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEscolas.length === 0 && (
            <div className="card text-center py-16">
              <School className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma escola encontrada</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tente ajustar os filtros de pesquisa</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setPagination(prev => ({ ...prev, page }))}
                  className={`w-10 h-10 rounded-xl font-medium transition-all ${
                    pagination.page === page
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300'
                  }`}>{page}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PesquisarEscolas;
