import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, Image as ImageIcon, Building2, Calendar, Tag } from 'lucide-react'
import api from '../../services/api'

const FALLBACK_DOCUMENTOS = [];

const CATEGORIAS_DEFAULT = [
  { id: 'noticia', label: 'Notícias', color: 'bg-blue-500' },
  { id: 'aviso_publicidade', label: 'Avisos e Publicidades', color: 'bg-orange-500' },
  { id: 'edital_licenca', label: 'Editais para Licenças', color: 'bg-red-500' },
  { id: 'visita', label: 'Visitas', color: 'bg-green-500' },
  { id: 'potencialidade', label: 'Potencialidades', color: 'bg-purple-500' },
  { id: 'geral', label: 'Geral', color: 'bg-gray-500' },
]

const CATEGORY_COLORS = {
  noticia: 'bg-[#2196F3] text-white',
  aviso_publicidade: 'bg-[#FF9800] text-white',
  edital_licenca: 'bg-[#F44336] text-white',
  visita: 'bg-[#4CAF50] text-white',
  potencialidade: 'bg-[#9C27B0] text-white',
  geral: 'bg-[#607D8B] text-white',
}

function formatarData(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function DocumentoCard({ doc }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {doc.imagem_url && (
        <div className="h-40 overflow-hidden">
          <img
            src={doc.imagem_url}
            alt={doc.titulo}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <span className={`inline-flex self-start items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[doc.categoria] || CATEGORY_COLORS.geral}`}>
          <Tag className="w-3 h-3" />
          {doc.categoria_label || doc.categoria}
        </span>
        <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white leading-snug">{doc.titulo}</h3>
        {doc.descricao && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-3 flex-1">{doc.descricao}</p>
        )}
        <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          {doc.referencia && <p><span className="font-medium">Referência:</span> {doc.referencia}</p>}
          {doc.numero && <p><span className="font-medium">Nº:</span> {doc.numero}</p>}
          {doc.data_documento && (
            <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatarData(doc.data_documento)}</p>
          )}
          {doc.instituicao_nome && (
            <Link to={`/escolas/${doc.instituicao_id}`} className="flex items-center gap-1 text-[#0061a4] hover:underline font-medium">
              <Building2 className="w-3.5 h-3.5" /> {doc.instituicao_nome}
            </Link>
          )}
        </div>
        {(doc.ficheiro_url || doc.imagem_url) && (
          <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            {doc.ficheiro_url && (
              <a href={doc.ficheiro_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-[#0061a4] hover:bg-[#00497d] transition-colors">
                <Download className="w-4 h-4" /> Abrir ficheiro
              </a>
            )}
            {doc.imagem_url && (
              <a href={doc.imagem_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0061a4] rounded-lg border border-[#0061a4] hover:bg-[#0061a4]/5 transition-colors">
                <ImageIcon className="w-4 h-4" /> Ver imagem
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PublicDocumentos() {
  const [documentos, setDocumentos] = useState(FALLBACK_DOCUMENTOS)
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT)
  const [categoriaAtiva, setCategoriaAtiva] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/documentos/categorias')
      .then(res => {
        if (res.data?.data?.length) setCategorias(res.data.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get('/documentos', { params: { limit: 100, ...(categoriaAtiva ? { categoria: categoriaAtiva } : {}) } })
      .then(res => {
        setDocumentos(res.data?.data || [])
        setError('')
      })
      .catch(() => setError('Erro ao carregar os documentos.'))
      .finally(() => setLoading(false))
  }, [categoriaAtiva])

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="bg-[#0D47A1] text-white px-4 sm:px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Documentos</h1>
          </div>
          <p className="mt-3 max-w-2xl text-blue-100">
            Anúncios, publicidades, editais para licenças, visitas, potencialidades e outras publicações das instituições de ensino.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setCategoriaAtiva('')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              categoriaAtiva === '' ? 'bg-[#0061a4] text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                categoriaAtiva === cat.id ? 'bg-[#0061a4] text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Ainda não existem documentos publicados nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentos.map(doc => <DocumentoCard key={doc._id || doc.id} doc={doc} />)}
          </div>
        )}
      </div>
    </div>
  )
}