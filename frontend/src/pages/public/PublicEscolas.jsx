import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Users,
  ChevronRight,
  School,
  Filter,
} from 'lucide-react';
import Loading from '../../components/Loading';
import { instituicaoService } from '../../services/api';

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'pre_escolar', label: 'Pré-Escolar' },
  { value: 'ensino_primario', label: 'Primário' },
  { value: 'ensino_medio', label: 'Médio' },
  { value: 'ensino_superior', label: 'Superior' },
];

const corVagas = (vagasDisponiveis, totalVagas) => {
  if (totalVagas === 0) return { cor: '#9E9E9E', nome: 'Indefinido' };
  const pct = (vagasDisponiveis / totalVagas) * 100;
  if (pct > 50) return { cor: '#4CAF50', nome: 'Aberto' };
  if (pct > 20) return { cor: '#FF9800', nome: 'Poucas' };
  return { cor: '#F44336', nome: 'Cheio' };
};

const badgeCor = (tipo) => {
  switch (tipo) {
    case 'pre_escolar':
      return { bg: '#FDE0DC', text: '#AD1457' };
    case 'ensino_primario':
      return { bg: '#E3F2FD', text: '#0D47A1' };
    case 'ensino_medio':
      return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'ensino_superior':
      return { bg: '#FCE4EC', text: '#C62828' };
    default:
      return { bg: '#F5F5F5', text: '#616161' };
  }
};

const ESCOLA_HERO_IMAGES = [
  '/imagens-escolas/isced-1.jpg',
  '/imagens-escolas/isced-3.jpg',
  '/imagens-escolas/isced-7.jpg',
  '/imagens-escolas/isced-10.jpg',
  '/imagens-escolas/isced-15.jpg',
  '/imagens-escolas/isced-21.jpg',
  '/imagens-escolas/ujes-1.jpg',
];

export default function PublicEscolas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [escolas, setEscolas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  const buscaTexto = searchParams.get('q') || '';
  const tipoFiltro = searchParams.get('tipo') || '';
  const paginaAtual = parseInt(searchParams.get('page') || '1', 10);

  const [inputBusca, setInputBusca] = useState(buscaTexto);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % ESCOLA_HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const buscarEscolas = useCallback(async () => {
    setCarregando(true);
    try {
      const params = { page: paginaAtual, limit: 9 };
      if (buscaTexto) params.search = buscaTexto;
      if (tipoFiltro) params.tipo = tipoFiltro;

      const res = await instituicaoService.getAll(params);
      const dados = res.data || res;
      setEscolas(Array.isArray(dados) ? dados : dados.items || dados.data || []);
      setTotalPaginas(dados.totalPages || dados.total_pages || 1);
      setTotalItens(dados.total || dados.totalItems || (Array.isArray(dados) ? dados.length : 0));
    } catch {
      setEscolas([]);
      setTotalPaginas(1);
      setTotalItens(0);
    } finally {
      setCarregando(false);
    }
  }, [buscaTexto, tipoFiltro, paginaAtual]);

  useEffect(() => {
    buscarEscolas();
  }, [buscarEscolas]);

  const atualizarParams = (novos) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(novos).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (novos.tipo !== undefined || novos.q !== undefined) params.set('page', '1');
    setSearchParams(params);
  };

  const submeterBusca = (e) => {
    e.preventDefault();
    atualizarParams({ q: inputBusca.trim() });
  };

  const selecionarTipo = (valor) => {
    atualizarParams({ tipo: valor });
  };

  const irPagina = (pag) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(pag));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const vagasInfo = (escola) => {
    const total = escola.vagas_totais || 0;
    const disponiveis = escola.vagas_disponiveis || 0;
    const ocupadas = total - disponiveis;
    const pct = total > 0 ? Math.round((disponiveis / total) * 100) : 0;
    return { total, ocupadas, disponiveis, pct };
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F6F8',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Header with rotating images */}
      <section className="relative overflow-hidden rounded-b-xl px-4 sm:px-8 py-20 flex flex-col items-center justify-center text-center min-h-[380px]">
        {ESCOLA_HERO_IMAGES.map((img, idx) => (
          <div key={idx}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img})`,
              opacity: heroIndex === idx ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D47A1]/85 via-[#0D47A1]/75 to-[#2196F3]/90" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <School size={40} className="text-white/90 mx-auto" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Pesquisar Escolas
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Encontre instituições de ensino na província do Huambo
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            {ESCOLA_HERO_IMAGES.map((_, idx) => (
              <button key={idx} onClick={() => setHeroIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  heroIndex === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 20px',
          position: 'relative',
          top: -28,
        }}
      >
        {/* Barra de busca */}
        <form
          onSubmit={submeterBusca}
          style={{
            display: 'flex',
            maxWidth: 720,
            margin: '0 auto',
            background: '#FFFFFF',
            borderRadius: 9999,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            border: '1px solid #E0E0E0',
            transition: 'box-shadow 0.2s',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 20,
              flex: 1,
            }}
          >
            <Search size={20} style={{ color: '#9E9E9E', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Nome da escola, município..."
              value={inputBusca}
              onChange={(e) => setInputBusca(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                padding: '18px 16px',
                color: '#212121',
                background: 'transparent',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#2196F3',
              color: '#FFFFFF',
              border: 'none',
              padding: '0 28px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s',
              borderRadius: '0 9999px 9999px 0',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1976D2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2196F3')}
          >
            <Search size={18} />
            Pesquisar
          </button>
        </form>

        {/* Filtros por tipo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginTop: 20,
            flexWrap: 'wrap',
          }}
        >
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => selecionarTipo(t.value)}
              style={{
                background: tipoFiltro === t.value ? '#2196F3' : '#FFFFFF',
                color: tipoFiltro === t.value ? '#FFFFFF' : '#424242',
                border: tipoFiltro === t.value ? '2px solid #2196F3' : '2px solid #E0E0E0',
                borderRadius: 9999,
                padding: '8px 20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: tipoFiltro === t.value
                  ? '0 2px 8px rgba(33,150,243,0.3)'
                  : 'none',
              }}
            >
              {t.value === '' && <Filter size={14} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Contador de resultados */}
        {!carregando && (
          <p
            style={{
              textAlign: 'center',
              color: '#757575',
              fontSize: '0.875rem',
              marginTop: 24,
              marginBottom: 16,
            }}
          >
            {totalItens > 0
              ? `${totalItens} escola${totalItens !== 1 ? 's' : ''} encontrada${totalItens !== 1 ? 's' : ''}`
              : 'Nenhum resultado'}
          </p>
        )}

        {/* Carregando */}
        {carregando && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Loading />
          </div>
        )}

        {/* Resultados */}
        {!carregando && escolas.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))',
              gap: 20,
              marginBottom: 40,
            }}
            className="escolas-grid"
          >
            {escolas.map((escola) => {
              const vagas = vagasInfo(escola);
              const vCor = corVagas(vagas.disponiveis, vagas.total);
              const bCor = badgeCor(escola.tipo || escola.tipo_instituicao);

              return (
                <div
                  key={escola.id || escola._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E8E8E8',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Barra colorida de vagas */}
                  <div
                    style={{
                      height: 4,
                      background: vCor.cor,
                      width: `${vagas.pct}%`,
                      minWidth: vagas.pct > 0 ? 8 : 0,
                    }}
                  />

                  <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Cabeçalho do card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#212121',
                          lineHeight: 1.3,
                          flex: 1,
                          paddingRight: 12,
                        }}
                      >
                        {escola.nome || escola.name}
                      </h3>
                      <span
                        style={{
                          background: bCor.bg,
                          color: bCor.text,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {escola.tipo === 'pre_escolar' ? 'Pré-Escolar' :
                         escola.tipo === 'ensino_primario' ? 'Primário' :
                         escola.tipo === 'ensino_medio' ? 'Médio' :
                         escola.tipo === 'ensino_superior' ? 'Superior' :
                         'N/I'}
                      </span>
                    </div>

                    {/* Município */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#616161',
                        fontSize: '0.875rem',
                        marginBottom: 6,
                      }}
                    >
                      <MapPin size={14} style={{ color: '#BDBDBD', flexShrink: 0 }} />
                      <span>{escola.municipio_nome || 'N/I'}</span>
                    </div>

                    {/* Tipo */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#616161',
                        fontSize: '0.875rem',
                        marginBottom: 16,
                      }}
                    >
                      <School size={14} style={{ color: '#BDBDBD', flexShrink: 0 }} />
                      <span>{
                        escola.tipo === 'pre_escolar' ? 'Ensino Pré-Escolar' :
                        escola.tipo === 'ensino_primario' ? 'Ensino Primário' :
                        escola.tipo === 'ensino_medio' ? 'Ensino Médio' :
                        escola.tipo === 'ensino_superior' ? 'Ensino Superior' :
                        escola.tipo || 'N/I'
                      }</span>
                    </div>

                    {/* Vagas */}
                    <div
                      style={{
                        background: '#FAFAFA',
                        borderRadius: 12,
                        padding: '12px 16px',
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: '#757575', fontWeight: 500 }}>
                          Vagas
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: vCor.cor,
                            background: `${vCor.cor}18`,
                            padding: '2px 8px',
                            borderRadius: 9999,
                          }}
                        >
                          {vCor.nome}
                        </span>
                      </div>

                      {/* Barra de progresso */}
                      <div
                        style={{
                          width: '100%',
                          height: 6,
                          background: '#E0E0E0',
                          borderRadius: 3,
                          overflow: 'hidden',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: `${100 - vagas.pct}%`,
                            height: '100%',
                            background: vCor.cor,
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#424242', fontWeight: 500 }}>
                          {vagas.disponiveis} disponíveis de {vagas.total}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>
                          {vagas.pct}%
                        </span>
                      </div>
                    </div>

                    {/* Link detalhes */}
                    <div style={{ marginTop: 'auto' }}>
                      <a
                        href={`/escolas/${escola.id || escola._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#2196F3',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#0D47A1')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#2196F3')}
                      >
                        Ver detalhes
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado vazio */}
        {!carregando && escolas.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
            }}
          >
            <School
              size={80}
              style={{ color: '#E0E0E0', marginBottom: 20 }}
            />
            <h3
              style={{
                color: '#424242',
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '0 0 8px',
              }}
            >
              Nenhuma escola encontrada
            </h3>
            <p style={{ color: '#9E9E9E', fontSize: '0.95rem', margin: 0 }}>
              Tente ajustar os filtros ou termos de pesquisa
            </p>
          </div>
        )}

        {/* Paginação */}
        {!carregando && totalPaginas > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              padding: '20px 0 60px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => irPagina(paginaAtual - 1)}
              disabled={paginaAtual <= 1}
              style={{
                border: '1px solid #E0E0E0',
                background: '#FFFFFF',
                color: paginaAtual <= 1 ? '#BDBDBD' : '#424242',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: '0.875rem',
                cursor: paginaAtual <= 1 ? 'default' : 'pointer',
                fontWeight: 500,
              }}
            >
              Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPaginas <= 7) return true;
                if (p === 1 || p === totalPaginas) return true;
                if (Math.abs(p - paginaAtual) <= 1) return true;
                return false;
              })
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push('...' + p);
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) => {
                if (typeof item === 'string') {
                  return (
                    <span
                      key={item}
                      style={{ color: '#BDBDBD', padding: '0 4px', fontSize: '0.875rem' }}
                    >
                      ...
                    </span>
                  );
                }
                const isActive = item === paginaAtual;
                return (
                  <button
                    key={item}
                    onClick={() => irPagina(item)}
                    style={{
                      border: isActive ? 'none' : '1px solid #E0E0E0',
                      background: isActive ? '#2196F3' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#424242',
                      borderRadius: 8,
                      width: 38,
                      height: 38,
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {item}
                  </button>
                );
              })}

            <button
              onClick={() => irPagina(paginaAtual + 1)}
              disabled={paginaAtual >= totalPaginas}
              style={{
                border: '1px solid #E0E0E0',
                background: '#FFFFFF',
                color: paginaAtual >= totalPaginas ? '#BDBDBD' : '#424242',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: '0.875rem',
                cursor: paginaAtual >= totalPaginas ? 'default' : 'pointer',
                fontWeight: 500,
              }}
            >
              Próximo
            </button>
          </div>
        )}
      </div>

      <style>{`
        .escolas-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .escolas-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .escolas-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
