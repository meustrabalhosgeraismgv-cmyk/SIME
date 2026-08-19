import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';

const ComunicadosGestor = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    titulo: '', conteudo: '', tipo: 'aviso', valor: 0,
    data_inicio_inscricao: '', data_fim_inscricao: ''
  });

  useEffect(() => { fetchComunicados(); }, []);

  const fetchComunicados = async () => {
    try {
      const res = await fetch('/api/comunicados/gestor', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sime_token')}` }
      });
      const data = await res.json();
      setComunicados(data.data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, instituicao_id: user?.entidade_id };
      if (editing) {
        await fetch(`/api/comunicados/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sime_token')}` },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/comunicados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sime_token')}` },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      setEditing(null);
      setForm({ titulo: '', conteudo: '', tipo: 'aviso', valor: 0, data_inicio_inscricao: '', data_fim_inscricao: '' });
      fetchComunicados();
    } catch (error) {
      alert('Erro ao guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover comunicado?')) return;
    try {
      await fetch(`/api/comunicados/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sime_token')}` }
      });
      fetchComunicados();
    } catch (error) {
      alert('Erro');
    }
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      titulo: c.titulo, conteudo: c.conteudo, tipo: c.tipo,
      valor: c.valor || 0, data_inicio_inscricao: c.data_inicio_inscricao || '',
      data_fim_inscricao: c.data_fim_inscricao || ''
    });
    setShowModal(true);
  };

  const tipoColors = {
    aviso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    inscricao: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    matricula: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    exame: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    evento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    geral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Comunicados</h1>
              <p className={`text-sm ${subtext}`}>Gerir comunicados da instituição</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setForm({ titulo: '', conteudo: '', tipo: 'aviso', valor: 0, data_inicio_inscricao: '', data_fim_inscricao: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Comunicado
          </button>
        </div>

        <div className="space-y-3">
          {comunicados.length === 0 ? (
            <div className={`${card} border rounded-2xl p-12 text-center`}>
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={`${text} font-medium`}>Nenhum comunicado</p>
              <p className={`text-sm ${subtext}`}>Crie o primeiro comunicado da instituição</p>
            </div>
          ) : comunicados.map(c => (
            <div key={c.id} className={`${card} border rounded-2xl p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${text}`}>{c.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoColors[c.tipo]}`}>{c.tipo}</span>
                    {c.valor > 0 && (
                      <span className="text-xs font-medium text-green-500">{c.valor.toLocaleString('pt-AO')} Kz</span>
                    )}
                  </div>
                  <p className={`text-sm ${subtext} line-clamp-2`}>{c.conteudo}</p>
                  {c.data_inicio_inscricao && (
                    <p className="text-xs text-primary-500 mt-1">
                      Inscrições: {c.data_inicio_inscricao} a {c.data_fim_inscricao || ' indefinido'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-primary-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${card} border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${text}`}>{editing ? 'Editar' : 'Novo'} Comunicado</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Título *</label>
                <input type="text" required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Conteúdo *</label>
                <textarea rows={4} required value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`}>
                    <option value="aviso">Aviso</option>
                    <option value="inscricao">Inscrição</option>
                    <option value="matricula">Matrícula</option>
                    <option value="exame">Exame</option>
                    <option value="evento">Evento</option>
                    <option value="geral">Geral</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Valor (Kz)</label>
                  <input type="number" value={form.valor} onChange={e => setForm({...form, valor: parseFloat(e.target.value) || 0})}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Início Inscrições</label>
                  <input type="date" value={form.data_inicio_inscricao} onChange={e => setForm({...form, data_inicio_inscricao: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Fim Inscrições</label>
                  <input type="date" value={form.data_fim_inscricao} onChange={e => setForm({...form, data_fim_inscricao: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl border ${input} ${text} text-sm`}>Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium">
                  {editing ? 'Actualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComunicadosGestor;
