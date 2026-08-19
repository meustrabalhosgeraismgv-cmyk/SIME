import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Image, Upload, Loader2, CheckCircle, RefreshCw, Save,
  Home, Newspaper, Lock, BookOpen, X, Eye
} from 'lucide-react';
import Loading from '../components/Loading';
import { configService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const CHAVES = [
  { chave: 'hero', label: 'Imagem Principal (Hero)', descricao: 'Aparece no topo da página pública, visível para todos os utilizadores.', icon: Home },
  { chave: 'noticias_capa', label: 'Capa da Página de Notícias', descricao: 'Imagem universal da secção de notícias.', icon: Newspaper },
  { chave: 'login_capa', label: 'Capa do Login/Registo', descricao: 'Imagem universal das páginas de autenticação.', icon: Lock },
  { chave: 'sobre', label: 'Imagem da Secção Sobre', descricao: 'Imagem universal da secção institucional.', icon: BookOpen },
];

const ConfiguracoesSistema = () => {
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [previews, setPreviews] = useState({});
  const [titulos, setTitulos] = useState({});
  const [subtitulos, setSubtitulos] = useState({});
  const fileInputs = useRef({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await configService.getAll();
      setConfigs(res.data.data || {});
      CHAVES.forEach(({ chave }) => {
        const item = res.data.data?.[chave];
        setTitulos(t => ({ ...t, [chave]: item?.titulo || '' }));
        setSubtitulos(t => ({ ...t, [chave]: item?.subtitulo || '' }));
      });
    } catch (e) {
      showToast({ message: 'Erro ao carregar configurações', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onFile = (chave, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviews(p => ({ ...p, [chave]: { file, url } }));
  };

  const removerPrevia = (chave) => {
    setPreviews(p => ({ ...p, [chave]: undefined }));
    if (fileInputs.current[chave]) fileInputs.current[chave].value = '';
  };

  const salvar = async (chave) => {
    setSavingKey(chave);
    try {
      const formData = new FormData();
      if (previews[chave]?.file) formData.append('imagem', previews[chave].file);
      formData.append('titulo', titulos[chave] || '');
      formData.append('subtitulo', subtitulos[chave] || '');
      await configService.updateChave(chave, formData);
      showToast({ message: 'Imagem do sistema atualizada com sucesso!', type: 'success' });
      setPreviews(p => ({ ...p, [chave]: undefined }));
      load();
    } catch (e) {
      showToast({ message: e.response?.data?.error || 'Erro ao atualizar imagem', type: 'error' });
    } finally {
      setSavingKey(null);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  if (loading) return <Loading text="A carregar configurações..." />;

  const previewAtiva = (chave) => previews[chave]?.url || configs?.[chave]?.imagem;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Imagens do Sistema</h1>
              <p className={`text-sm ${subtext}`}>Configuração universal — as alterações ficam visíveis para todos os utilizadores</p>
            </div>
          </div>
          <button onClick={load} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-primary-900/20 border-primary-800' : 'bg-primary-50 border-primary-200'}`}>
          <p className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-primary-300' : 'text-primary-700'}`}>
            <Eye className="w-4 h-4" />
            As imagens definidas aqui substituem os fundos padrão em todas as páginas públicas, independentemente da localização ou IP do utilizador.
          </p>
        </div>

        <div className="space-y-6">
          {CHAVES.map(({ chave, label, descricao, icon: Icon }) => (
            <div key={chave} className={`${card} border rounded-2xl overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className={`font-semibold ${text}`}>{label}</h2>
                  <p className={`text-xs ${subtext}`}>{descricao}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Título (opcional)</label>
                    <input
                      type="text"
                      value={titulos[chave] || ''}
                      onChange={e => setTitulos(t => ({ ...t, [chave]: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500' : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Subtítulo (opcional)</label>
                    <input
                      type="text"
                      value={subtitulos[chave] || ''}
                      onChange={e => setSubtitulos(t => ({ ...t, [chave]: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500' : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'}`}
                    />
                  </div>
                </div>

                <div className={`relative rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-100'}`} style={{ minHeight: '180px' }}>
                  {previewAtiva(chave) ? (
                    <>
                      <img src={previewAtiva(chave)} alt={label} className="w-full h-56 object-cover" />
                      {previews[chave]?.file && (
                        <button onClick={() => removerPrevia(chave)} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-56 text-center">
                      <div>
                        <Image className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className={`text-sm ${subtext}`}>Sem imagem definida. Usa o fundo padrão.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    ref={el => { fileInputs.current[chave] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => onFile(chave, e.target.files?.[0])}
                    className="text-sm text-gray-500 file:mr-4 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-primary-500 file:text-white file:text-sm file:font-medium hover:file:bg-primary-600"
                  />
                  <div className="md:ml-auto">
                    <button
                      onClick={() => salvar(chave)}
                      disabled={savingKey === chave}
                      className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {savingKey === chave ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesSistema;