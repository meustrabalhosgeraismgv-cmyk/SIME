import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Calendar, Tag, ChevronRight, ArrowRight } from 'lucide-react'
import api from '../../services/api'

const FALLBACK_NOTICIAS = [];

const CATEGORIAS = [
  { id: 'todas', label: 'Todas', color: 'bg-gray-500' },
  { id: 'educacao', label: 'Educação', color: 'bg-blue-500' },
  { id: 'aviso', label: 'Avisos', color: 'bg-orange-500' },
  { id: 'evento', label: 'Eventos', color: 'bg-green-500' },
  { id: 'edital', label: 'Editais', color: 'bg-red-500' },
  { id: 'circular', label: 'Circulares', color: 'bg-purple-500' },
  { id: 'geral', label: 'Geral', color: 'bg-gray-500' },
]

const CATEGORY_COLORS = {
  educacao: 'bg-[#2196F3] text-white',
  aviso: 'bg-[#FF9800] text-white',
  evento: 'bg-[#4CAF50] text-white',
  edital: 'bg-[#F44336] text-white',
  circular: 'bg-[#7B1FA2] text-white',
  geral: 'bg-[#607D8B] text-white',
}

const ITENS_POR_PAGINA = 6

function formatarData(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function NoticiaCard({ noticia }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {noticia.imagem && (
        <div className="h-48 overflow-hidden">
          <img
            src={noticia.imagem}
            alt={noticia.titulo}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              CATEGORY_COLORS[noticia.categoria] || 'bg-gray-400 text-white'
            }`}
          >
            {noticia.categoria}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={12} />
            {formatarData(noticia.created_at)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {noticia.titulo}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
          {noticia.resumo}
        </p>
        <Link
          to={`/noticias/${noticia.id}`}
          className="inline-flex items-center gap-1 text-[#2196F3] dark:text-[#64B5F6] text-sm font-semibold hover:gap-2 transition-all"
        >
          Ler mais <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function NoticiaDestaque({ noticia }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {noticia.imagem && (
          <div className="h-64 lg:h-auto overflow-hidden">
            <img
              src={noticia.imagem}
              alt={noticia.titulo}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className={`p-8 flex flex-col justify-center ${!noticia.imagem ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                CATEGORY_COLORS[noticia.categoria] || 'bg-gray-400 text-white'
              }`}
            >
              {noticia.categoria}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Calendar size={14} />
              {formatarData(noticia.created_at)}
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {noticia.titulo}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {noticia.resumo}
          </p>
          <div>
            <Link
              to={`/noticias/${noticia.id}`}
              className="inline-flex items-center gap-2 bg-[#2196F3] hover:bg-[#1976D2] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Ler notícia completa <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState([])
  const [destaque, setDestaque] = useState(null)
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)
      try {
        const [noticiasRes, destaqueRes] = await Promise.all([
          api.get('/noticias'),
          api.get('/noticias/destaque'),
        ])
        const noticiasData = noticiasRes.data?.data || noticiasRes.data || []
        const lista = Array.isArray(noticiasData) ? noticiasData : []
        setNoticias(lista)
        setDestaque(destaqueRes.data?.[0] || destaqueRes.data || null)
      } catch {
        setNoticias([])
        setDestaque(null)
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  const noticiasFiltradas =
    categoriaAtiva === 'todas'
      ? noticias
      : noticias.filter((n) => n.categoria === categoriaAtiva)

  const totalPaginas = Math.ceil(noticiasFiltradas.length / ITENS_POR_PAGINA)
  const noticiasPaginadas = noticiasFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  useEffect(() => {
    setPaginaAtual(1)
  }, [categoriaAtiva])

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-gray-900 transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-xl px-4 sm:px-8 py-20 flex flex-col items-center justify-center text-center min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D47A1] via-[#0D47A1] to-[#1976D2]" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Newspaper size={36} className="text-white/90" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Notícias do Sistema Educacional
            </h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Fique por dentro de tudo que acontece na educação do nosso município
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-2 justify-center">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                categoriaAtiva === cat.id
                  ? 'bg-[#2196F3] text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#2196F3] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Carregando notícias...</p>
          </div>
        ) : noticiasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Newspaper size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Não há notícias disponíveis para a categoria selecionada. Tente filtrar por outra categoria.
            </p>
          </div>
        ) : (
          <>
            {/* Destaque */}
            {destaque && categoriaAtiva === 'todas' && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag size={16} />
                  Destaque
                </h2>
                <NoticiaDestaque noticia={destaque} />
              </section>
            )}

            {/* Grid de Notícias */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                {categoriaAtiva === 'todas' ? 'Todas as Notícias' : `Categoria: ${categoriaAtiva}`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {noticiasPaginadas.map((noticia) => (
                  <NoticiaCard key={noticia.id} noticia={noticia} />
                ))}
              </div>
            </section>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <section className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPaginaAtual(pg)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                      pg === paginaAtual
                        ? 'bg-[#2196F3] text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
