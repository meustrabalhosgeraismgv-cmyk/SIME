import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Newspaper, Calendar, Tag, ArrowLeft, Loader2, Building2, Play
} from 'lucide-react';
import api from '../../services/api';

const CATEGORY_COLORS = {
  educacao: 'bg-[#2196F3] text-white',
  aviso: 'bg-[#FF9800] text-white',
  evento: 'bg-[#4CAF50] text-white',
  edital: 'bg-[#F44336] text-white',
  circular: 'bg-[#7B1FA2] text-white',
  visita: 'bg-[#00897B] text-white',
  potencialidade: 'bg-[#9C27B0] text-white',
  geral: 'bg-[#607D8B] text-white',
};

const CATEGORIA_LABELS = {
  educacao: 'Educação', aviso: 'Avisos', evento: 'Eventos',
  edital: 'Editais', circular: 'Circulares', visita: 'Visitas',
  potencialidade: 'Potencialidades', geral: 'Geral',
};

function formatarData(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function embedVideo(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return url.replace('watch?v=', 'embed/');
  return url;
}

export default function NoticiaDetalhe() {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get(`/noticias/${id}`)
      .then(res => setNoticia(res.data))
      .catch(() => setErro('Notícia não encontrada.'))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2196F3]" />
      </div>
    );
  }

  if (erro || !noticia) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Newspaper className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">{erro || 'Notícia não encontrada.'}</p>
        <Link to="/noticias" className="inline-flex items-center gap-2 bg-[#2196F3] text-white px-5 py-2.5 rounded-xl font-semibold">
          <ArrowLeft size={18} /> Voltar às Notícias
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-[#0061a4] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[noticia.categoria] || 'bg-gray-400 text-white'}`}>
              {CATEGORIA_LABELS[noticia.categoria] || noticia.categoria}
            </span>
            <span className="flex items-center gap-1 text-sm text-white/80">
              <Calendar size={14} /> {formatarData(noticia.created_at)}
            </span>
            {noticia.instituicao_nome && (
              <span className="flex items-center gap-1 text-sm text-white/80">
                <Building2 size={14} /> {noticia.instituicao_nome}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">{noticia.titulo}</h1>
          {noticia.resumo && <p className="text-lg text-white/85">{noticia.resumo}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/noticias" className="inline-flex items-center gap-2 text-[#2196F3] font-semibold mb-8 hover:gap-3 transition-all">
          <ArrowLeft size={18} /> Voltar às Notícias
        </Link>

        {(noticia.imagem_url || noticia.imagem) && (
          <img
            src={noticia.imagem_url || noticia.imagem}
            alt={noticia.titulo}
            className="w-full max-h-[420px] object-cover rounded-2xl shadow-lg mb-8"
          />
        )}

        <article className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {noticia.conteudo}
        </article>

        {(noticia.videos || []).length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Play size={20} className="text-[#2196F3]" /> Vídeos
            </h2>
            <div className="space-y-4">
              {noticia.videos.map((v, i) => {
                const src = embedVideo(v.url);
                return (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {v.titulo && (
                      <p className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">{v.titulo}</p>
                    )}
                    {src.includes('embed') ? (
                      <div className="aspect-video">
                        <iframe
                          src={src}
                          title={v.titulo || 'Vídeo'}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video src={v.url} controls className="w-full aspect-video bg-black" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}