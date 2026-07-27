import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

const GerirVagas = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [instituicao, setInstituicao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vagasTotais, setVagasTotais] = useState(0);
  const [vagasDisponiveis, setVagasDisponiveis] = useState(0);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/instituicoes/${user?.entidade_id}`);
      const data = await res.json();
      setInstituicao(data);
      setVagasTotais(data.vagas_totais || 0);
      setVagasDisponiveis(data.vagas_disponiveis || 0);
    } catch (error) {
      console.error('Erro:', error);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/instituicoes/${user?.entidade_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vagas_totais: parseInt(vagasTotais), vagas_disponiveis: parseInt(vagasDisponiveis) })
      });
      alert('Vagas atualizadas!');
    } catch (error) {
      alert('Erro ao guardar');
    } finally { setSaving(false); }
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

  const esgotadas = parseInt(vagasTotais) - parseInt(vagasDisponiveis);

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Gerir Vagas</h1>
            <p className={`text-sm ${subtext}`}>Controlo de vagas da instituição</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-primary-500`}>{vagasTotais}</p>
            <p className={`text-sm ${subtext} mt-1`}>Total de Vagas</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className="text-3xl font-bold text-green-500">{vagasDisponiveis}</p>
            <p className={`text-sm ${subtext} mt-1`}>Vagas Disponíveis</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className="text-3xl font-bold text-red-500">{esgotadas}</p>
            <p className={`text-sm ${subtext} mt-1`}>Vagas Esgotadas</p>
          </div>
        </div>

        <div className={`${card} border rounded-2xl p-6`}>
          <h2 className={`text-lg font-semibold ${text} mb-4`}>Actualizar Vagas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${subtext} mb-1`}>Vagas Totais</label>
              <input type="number" value={vagasTotais} onChange={e => setVagasTotais(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} min="0" />
            </div>
            <div>
              <label className={`block text-sm font-medium ${subtext} mb-1`}>Vagas Disponíveis</label>
              <input type="number" value={vagasDisponiveis} onChange={e => setVagasDisponiveis(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} min="0" max={vagasTotais} />
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-3 mb-4">
            <div className="bg-primary-500 h-3 rounded-full transition-all"
              style={{ width: `${vagasTotais > 0 ? (vagasDisponiveis / vagasTotais) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />}
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerirVagas;
