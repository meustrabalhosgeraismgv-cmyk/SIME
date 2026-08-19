import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Calendar as CalendarIcon, Plus, Pencil, Trash2, Loader2,
  RefreshCw, MapPin, X, Save
} from 'lucide-react';
import Loading from '../components/Loading';
import { calendarService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const TIPOS = [
  { value: 'feriado', label: 'Feriado' },
  { value: 'evento', label: 'Evento' },
  { value: 'inscricao', label: 'Período de Inscrição' },
  { value: 'avaliacao', label: 'Avaliação/Exame' },
  { value: 'recesso', label: 'Recesso Escolar' },
  { value: 'outro', label: 'Outro' },
];

const CORES = ['#0061a4', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#2b5bb5', '#607D8B'];

const GERIR_MODE = ['admin'];

const GerirCalendario = () => {
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', tipo: 'evento',
    data_inicio: '', data_fim: '', ano_letivo: String(new Date().getFullYear()),
    local: '', cor: '#0061a4'
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await calendarioService.getAll({});
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setEventos(data);
    } catch (e) {
      showToast({ message: 'Erro ao carregar calendário', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNovo = () => {
    setEditing(null);
    setForm({
      titulo: '', descricao: '', tipo: 'evento',
      data_inicio: '', data_fim: '', ano_letivo: String(new Date().getFullYear()),
      local: '', cor: '#0061a4'
    });
    setShowModal(true);
  };

  const openEditar = (e) => {
    setEditing(e);
    setForm({
      titulo: e.titulo || '',
      descricao: e.descricao || '',
      tipo: e.tipo || 'evento',
      data_inicio: e.data_inicio ? e.data_inicio.slice(0, 10) : '',
      data_fim: e.data_fim ? e.data_fim.slice(0, 10) : '',
      ano_letivo: e.ano_letivo || String(new Date().getFullYear()),
      local: e.local || '',
      cor: e.cor || '#0061a4'
    });
    setShowModal(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.data_inicio) {
      showToast({ message: 'Título e data de início são obrigatórios', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await calendarioService.update(editing._id || editing.id, form);
        showToast({ message: 'Evento atualizado com sucesso', type: 'success' });
      } else {
        await calendarioService.create(form);
        showToast({ message: 'Evento criado com sucesso', type: 'success' });
      }
      setShowModal(false);
      load();
    } catch (err) {
      showToast({ message: err.response?.data?.error || 'Erro ao guardar evento', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (e) => {
    if (!confirm(`Eliminar o evento "${e.titulo}"?`)) return;
    try {
      await calendarioService.delete(e._id || e.id);
      showToast({ message: 'Evento eliminado', type: 'success' });
      load();
    } catch (err) {
      showToast({ message: err.response?.data?.error || 'Erro ao eliminar', type: 'error' });
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const tipoLabel = (t) => TIPOS.find(x => x.value === t)?.label || t;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Calendário Escolar</h1>
              <p className={`text-sm ${subtext}`}>Gerencie o calendário oficial visível para todas as instituições e utilizadores</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
            <button onClick={openNovo} className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" /> Novo Evento
            </button>
          </div>
        </div>

        {loading ? (
          <Loading text="A carregar calendário..." />
        ) : eventos.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={subtext}>Ainda não existem eventos no calendário.</p>
          </div>
        ) : (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {eventos.map(e => (
                <div key={e._id || e.id} className="p-5 flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0" style={{ backgroundColor: (e.cor || '#0061a4') + '22' }}>
                    <span className="text-lg font-bold" style={{ color: e.cor || '#0061a4' }}>
                      {e.data_inicio ? new Date(e.data_inicio).getDate() : '—'}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: e.cor || '#0061a4' }}>
                      {e.data_inicio ? new Date(e.data_inicio).toLocaleDateString('pt-AO', { month: 'short' }) : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${text}`}>{e.titulo}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium">{tipoLabel(e.tipo)}</span>
                    </div>
                    {e.descricao && <p className={`text-sm ${subtext} mt-1 line-clamp-2`}>{e.descricao}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs ${subtext}">
                      <span className={subtext}>
                        {e.data_inicio ? new Date(e.data_inicio).toLocaleDateString('pt-AO') : ''}
                        {e.data_fim && e.data_fim !== e.data_inicio ? ` — ${new Date(e.data_fim).toLocaleDateString('pt-AO')}` : ''}
                      </span>
                      <span className={`${subtext}`}>Ano lectivo {e.ano_letivo}</span>
                      {e.local && <span className={`flex items-center gap-1 ${subtext}`}><MapPin className="w-3 h-3" /> {e.local}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditar(e)} className={`p-2 rounded-lg border ${card} ${text}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => excluir(e)} className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${card} border rounded-2xl p-6 max-w-lg w-full`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${text}`}>{editing ? 'Editar Evento' : 'Novo Evento'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={salvar} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Título *</label>
                  <input type="text" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Descrição</label>
                  <textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Tipo</label>
                    <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Ano Lectivo</label>
                    <input type="text" value={form.ano_letivo} onChange={e => setForm({ ...form, ano_letivo: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Data de Início *</label>
                    <input type="date" required value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Data de Fim</label>
                    <input type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Local</label>
                  <input type="text" value={form.local} onChange={e => setForm({ ...form, local: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Cor</label>
                  <div className="flex gap-2">
                    {CORES.map(c => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, cor: c })}
                        className={`w-8 h-8 rounded-full ${form.cor === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl border ${card} ${text} text-sm`}>Cancelar</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerirCalendario;