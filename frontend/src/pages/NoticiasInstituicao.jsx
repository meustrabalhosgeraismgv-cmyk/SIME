import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Newspaper, Plus, Trash2, Edit2, Loader2, X, Upload, ImagePlus,
  Video, CheckCircle, Clock, Link as LinkIcon, Star
} from 'lucide-react';
import { noticiaService } from '../services/api';

const CATEGORIAS = [
  { id: 'educacao', label: 'Educação' },
  { id: 'aviso', label: 'Aviso' },
  { id: 'evento', label: 'Evento' },
  { id: 'edital', label: 'Edital' },
  { id: 'circular', label: 'Circular' },
  { id: 'visita', label: 'Visitas' },
  { id: 'potencialidade', label: 'Potencialidades' },
  { id: 'geral', label: 'Geral' },
];

const Vazio = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
  </div>
);

const NoticiasInstituicao = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [form, setForm] = useState({
    titulo: '', resumo: '', conteudo: '', categoria: 'educacao',
    imagem_url: '', destaque: false, videos: []
  });
  const imagemInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => { fetchNoticias(); }, []);

  const fetchNoticias = async () => {
    try {
      const res = await noticiaService.getGestor();
      setNoticias(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ titulo: '', resumo: '', conteudo: '', categoria: 'educacao', imagem_url: '', destaque: false, videos: [] });
    setVideoUrlInput('');
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.conteudo.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, instituicao_id: user?.entidade_id };
      if (editing) {
        await noticiaService.update(editing.id, payload);
      } else {
        await noticiaService.create(payload);
      }
      setShowModal(false);
      resetForm();
      fetchNoticias();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao guardar notícia');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta notícia?')) return;
    try {
      await noticiaService.delete(id);
      fetchNoticias();
    } catch (error) {
      alert('Erro ao remover');
    }
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({
      titulo: n.titulo, resumo: n.resumo || '', conteudo: n.conteudo || '',
      categoria: n.categoria || 'educacao', imagem_url: n.imagem_url || '',
      destaque: !!n.destaque, videos: n.videos || []
    });
    setShowModal(true);
  };

  const handleUploadImagem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImagem(true);
    try {
      let res;
      if (editing) {
        res = await noticiaService.uploadImagem(editing.id, file);
      } else {
        const createRes = await noticiaService.create({ ...form, instituicao_id: user?.entidade_id });
        const novoId = createRes.data.id;
        res = await noticiaService.uploadImagem(novoId, file);
        setEditing({ id: novoId });
        const full = await noticiaService.getById(novoId);
        const n = full.data;
        setForm(f => ({ ...f, imagem_url: n.imagem_url || '' }));
        fetchNoticias();
      }
      setForm(f => ({ ...f, imagem_url: res.data.imagem_url }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally { setUploadingImagem(false); }
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      let id = editing?.id;
      if (!id) {
        const createRes = await noticiaService.create({ ...form, instituicao_id: user?.entidade_id });
        id = createRes.data.id;
        setEditing({ id });
        fetchNoticias();
      }
      const res = await noticiaService.uploadVideo(id, file, file.name);
      setForm(f => ({ ...f, videos: [...f.videos, res.data.video] }));
    } catch (error) {
      alert('Erro ao fazer upload do vídeo');
    } finally { setUploadingVideo(false); }
  };

  const addVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    setForm(f => ({ ...f, videos: [...f.videos, { url, titulo: '', plataforma: 'link' }] }));
    setVideoUrlInput('');
  };

  const removeVideo = (idx) => {
    setForm(f => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }));
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  if (loading) return <Vazio />;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Notícias e Avisos</h1>
              <p className={`text-sm ${subtext}`}>Publique notícias, avisos, editais e vídeos institucionais. As publicações passam por aprovação do administrador.</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Nova Notícia
          </button>
        </div>

        {noticias.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={`${text} font-medium`}>Nenhuma notícia publicada</p>
            <p className={`text-sm ${subtext}`}>Crie a primeira notícia ou aviso da sua instituição</p>
          </div>
        ) : (
          <div className="space-y-3">
            {noticias.map(n => (
              <div key={n.id} className={`${card} border rounded-2xl p-5`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold ${text}`}>{n.titulo}</h3>
                      {n.publicada === 1 ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> Publicada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock className="w-3 h-3" /> Aguarda aprovação
                        </span>
                      )}
                      {n.destaque === 1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Star className="w-3 h-3" /> Destaque
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-2">{n.categoria}</span>
                    {n.resumo && <p className={`text-sm ${subtext} line-clamp-2`}>{n.resumo}</p>}
                    {n.videos?.length > 0 && (
                      <p className={`text-xs ${subtext} mt-1 flex items-center gap-1`}>
                        <Video className="w-3 h-3" /> {n.videos.length} vídeo(s) institucional(is)
                      </p>
                    )}
                    <p className={`text-xs ${subtext} mt-1`}>{new Date(n.created_at).toLocaleDateString('pt-AO')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(n)} className="p-2 text-gray-400 hover:text-primary-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(n.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`${card} border rounded-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${text}`}>{editing ? 'Editar' : 'Nova'} Notícia</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Título *</label>
                <input type="text" required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Categoria</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`}>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary-500">
                    <input type="checkbox" checked={form.destaque} onChange={e => setForm({...form, destaque: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300" />
                    Marcar como Destaque
                  </label>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Resumo</label>
                <input type="text" value={form.resumo} onChange={e => setForm({...form, resumo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} placeholder="Breve resumo da notícia" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Conteúdo *</label>
                <textarea rows={5} required value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none resize-none`} />
              </div>

              {/* Imagem */}
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-2`}>Imagem de Destaque</label>
                <div className={`rounded-xl overflow-hidden border ${input} h-40 flex items-center justify-center bg-gray-100 dark:bg-navy-700 mb-2`}>
                  {form.imagem_url ? (
                    <img src={form.imagem_url} alt="Imagem" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-xs ${subtext}`}>Sem imagem — carregue uma imagem real da instituição</span>
                  )}
                </div>
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed ${input} ${text} cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors`}>
                  {uploadingImagem ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {uploadingImagem ? 'A carregar...' : 'Carregar Imagem'}
                  <input type="file" ref={imagemInputRef} accept="image/*" className="hidden" onChange={handleUploadImagem} />
                </label>
              </div>

              {/* Vídeos institucionais */}
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-2`}>Vídeos Institucionais</label>
                {form.videos.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {form.videos.map((v, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${input}`}>
                        <Video className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className={`text-sm ${text} truncate flex-1`}>{v.titulo || v.url}</span>
                        {v.plataforma === 'upload' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">Upload</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">Link</span>
                        )}
                        <button type="button" onClick={() => removeVideo(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed ${input} ${text} cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors flex-shrink-0`}>
                    {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingVideo ? 'A carregar...' : 'Carregar Vídeo'}
                    <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={handleUploadVideo} />
                  </label>
                  <div className="flex flex-1 gap-2">
                    <input type="url" value={videoUrlInput} onChange={e => setVideoUrlInput(e.target.value)} placeholder="Ou cole um link (YouTube, Facebook...)"
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                    <button type="button" onClick={addVideoUrl} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex-shrink-0">
                      <LinkIcon className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl border ${input} ${text} text-sm`}>Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Actualizar' : 'Publicar'}
                </button>
              </div>
              <p className={`text-xs ${subtext}`}>As notícias criadas ficam pendentes de aprovação pelo administrador do sistema antes de aparecerem no portal público.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticiasInstituicao;