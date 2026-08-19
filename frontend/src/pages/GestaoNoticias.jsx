import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Newspaper, CheckCircle, XCircle, Loader2, RefreshCw, Plus,
  Eye, Clock, FileText, Trash2, Pencil, AlertTriangle, Building2
} from 'lucide-react';
import Loading from '../components/Loading';
import { noticiaService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const TABS = [
  { key: 'pendentes', label: 'Aguardando Aprovação', icon: Clock },
  { key: 'publicadas', label: 'Publicadas', icon: CheckCircle },
  { key: 'rejeitadas', label: 'Rejeitadas', icon: XCircle },
];

const GestaoNoticias = () => {
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [tab, setTab] = useState('pendentes');
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [motivoModal, setMotivoModal] = useState(null);
  const [motivo, setMotivo] = useState('');

  const load = async (tabAtiva = tab) => {
    setLoading(true);
    try {
      let res;
      if (tabAtiva === 'pendentes') res = await noticiaService.getAdminPendentes();
      else if (tabAtiva === 'publicadas') res = await noticiaService.getAdminTodas();
      else res = await noticiaService.getAdminTodas();
      let lista = res.data.data || [];
      if (tabAtiva === 'publicadas') lista = lista.filter(n => n.publicada === 1);
      if (tabAtiva === 'rejeitadas') lista = lista.filter(n => n.publicada === -1);
      setNoticias(lista);
    } catch (e) {
      showToast({ message: 'Erro ao carregar notícias', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  const mudarTab = (t) => { setTab(t); };

  const aprovar = async (id) => {
    setProcessing(id);
    try {
      await noticiaService.aprovar(id);
      showToast({ message: 'Notícia aprovada e publicada!', type: 'success' });
      load();
    } catch (e) {
      showToast({ message: e.response?.data?.error || 'Erro ao aprovar', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const confirmarRejeicao = async () => {
    if (!motivoModal) return;
    setProcessing(motivoModal.id);
    try {
      await noticiaService.rejeitar(motivoModal.id, motivo);
      showToast({ message: 'Notícia rejeitada', type: 'success' });
      setMotivoModal(null);
      setMotivo('');
      load();
    } catch (e) {
      showToast({ message: e.response?.data?.error || 'Erro ao rejeitar', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const excluir = async (id) => {
    if (!confirm('Eliminar esta notícia?')) return;
    setProcessing(id);
    try {
      await noticiaService.delete(id);
      showToast({ message: 'Notícia eliminada', type: 'success' });
      load();
    } catch (e) {
      showToast({ message: e.response?.data?.error || 'Erro ao eliminar', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const badgePublicada = (n) => {
    if (n.publicada === 1) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (n.publicada === -1) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };
  const labelPublicada = (n) => {
    if (n.publicada === 1) return 'Publicada';
    if (n.publicada === -1) return 'Rejeitada';
    return 'Aguardando aprovação';
  };

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Gestão de Notícias</h1>
              <p className={`text-sm ${subtext}`}>Aprove, rejeite ou publique notícias das instituições</p>
            </div>
          </div>
          <button onClick={() => load()} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => mudarTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-primary-500 text-white shadow-sm' : `border ${card} ${text}`
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <Loading text="A carregar notícias..." />
        ) : noticias.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={subtext}>Nenhuma notícia neste estado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {noticias.map(n => (
              <div key={n.id} className={`${card} border rounded-2xl overflow-hidden`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {n.imagem_url ? (
                      <img src={n.imagem_url} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${text}`}>{n.titulo}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgePublicada(n)}`}>{labelPublicada(n)}</span>
                      </div>
                      <p className={`text-sm ${subtext} mt-1 line-clamp-2`}>{n.resumo || n.conteudo?.slice(0, 120) || ''}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs ${subtext}">
                        <span className={`flex items-center gap-1 ${subtext}`}>
                          <Building2 className="w-3.5 h-3.5" /> {n.instituicao_nome || 'Administração'}
                        </span>
                        <span className={`${subtext}`}>{new Date(n.created_at).toLocaleDateString('pt-AO')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${subtext}`}>{n.categoria}</span>
                      </div>
                      {n.motivo_rejeicao && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                          <strong>Motivo da rejeição:</strong> {n.motivo_rejeicao}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {tab === 'pendentes' && (
                        <>
                          <button onClick={() => aprovar(n.id)} disabled={processing === n.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                            {processing === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Aprovar e Publicar
                          </button>
                          <button onClick={() => setMotivoModal(n)} disabled={processing === n.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                            <XCircle className="w-4 h-4" /> Rejeitar
                          </button>
                        </>
                      )}
                      {(tab === 'publicadas' || tab === 'rejeitadas') && (
                        <>
                          {tab === 'rejeitadas' && (
                            <button onClick={() => aprovar(n.id)} disabled={processing === n.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                              <CheckCircle className="w-4 h-4" /> Aprovar
                            </button>
                          )}
                          <button onClick={() => excluir(n.id)} disabled={processing === n.id}
                            className="flex items-center gap-2 px-4 py-2 border ${card} ${text} rounded-xl text-sm font-medium">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {motivoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${card} border rounded-2xl p-6 max-w-md w-full`}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className={`font-semibold ${text}`}>Rejeitar Notícia</h3>
              </div>
              <p className={`text-sm ${subtext} mb-3`}>Indique o motivo da rejeição de "{motivoModal.titulo}":</p>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Ex: Conteúdo fora das normas de publicação..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setMotivoModal(null); setMotivo(''); }} className={`px-4 py-2 rounded-xl border ${card} ${text} text-sm`}>Cancelar</button>
                <button onClick={confirmarRejeicao} disabled={processing === motivoModal.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {processing === motivoModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestaoNoticias;