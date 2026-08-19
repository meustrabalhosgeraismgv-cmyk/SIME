import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3, Edit2, Loader2, Save, GraduationCap, AlertTriangle } from 'lucide-react';
import { instituicaoService, turmaService } from '../services/api';

const GerirVagas = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [instituicao, setInstituicao] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTurma, setSavingTurma] = useState(null);
  const [vagasTotais, setVagasTotais] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);

  const entidadeId = user?.entidade_id;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAlertMsg(null);
      if (!entidadeId) {
        setAlertMsg({ type: 'error', message: 'Instituição não identificada para este utilizador.' });
        return;
      }
      const [instRes, turmasRes] = await Promise.all([
        instituicaoService.getById(entidadeId),
        turmaService.getAll({ instituicao_id: entidadeId, limit: 100 }).catch(() => ({ data: { data: [] } }))
      ]);
      const data = instRes.data || {};
      setInstituicao(data);
      setVagasTotais(data.vagas_totais || 0);
      setTurmas(turmasRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      setAlertMsg({ type: 'error', message: error.response?.data?.error || 'Erro ao carregar dados das vagas' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setAlertMsg(null);
    try {
      await instituicaoService.update(entidadeId, { vagas_totais: parseInt(vagasTotais) || 0 });
      setAlertMsg({ type: 'success', message: 'Vagas totais atualizadas!' });
    } catch (error) {
      setAlertMsg({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTurma = async (turma) => {
    setSavingTurma(turma.id);
    setAlertMsg(null);
    try {
      await turmaService.update(turma.id, {
        nome: turma.nome,
        ano_letivo: turma.ano_letivo,
        nivel: turma.nivel,
        instituicao_id: turma.instituicao_id,
        professor_titular_id: turma.professor_titular_id || null,
        vagas: parseInt(turma.vagas) || 0
      });
      setAlertMsg({ type: 'success', message: `Vagas da turma "${turma.nome}" atualizadas` });
      fetchData();
    } catch (error) {
      setAlertMsg({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar turma' });
    } finally {
      setSavingTurma(null);
    }
  };

  const mudarVagasTurma = (id, valor) => {
    const n = Math.max(0, parseInt(valor) || 0);
    setTurmas(prev => prev.map(t => t.id === id ? { ...t, vagas: n } : t));
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

  const totalVagasTurmas = turmas.reduce((s, t) => s + (parseInt(t.vagas) || 0), 0);
  const totalOcupadas = turmas.reduce((s, t) => s + (parseInt(t.vagas_ocupadas) || 0), 0);
  const disponiveisReais = totalVagasTurmas - totalOcupadas;
  const esgotadas = totalOcupadas;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Gerir Vagas</h1>
            <p className={`text-sm ${subtext}`}>Vagas reais por turma da instituição — atualizadas automaticamente nas matrículas</p>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border mb-6 ${
            alertMsg.type === 'success'
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-700'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${alertMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <p className="text-sm font-medium">{alertMsg.message}</p>
            <button onClick={() => setAlertMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold text-primary-500`}>{totalVagasTurmas}</p>
            <p className={`text-sm ${subtext} mt-1`}>Vagas nas Turmas</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className="text-3xl font-bold text-green-500">{disponiveisReais}</p>
            <p className={`text-sm ${subtext} mt-1`}>Vagas Disponíveis (reais)</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className="text-3xl font-bold text-red-500">{esgotadas}</p>
            <p className={`text-sm ${subtext} mt-1`}>Vagas Ocupadas</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{instituicao?.vagas_totais || 0}</p>
            <p className={`text-sm ${subtext} mt-1`}>Total Global (Instituição)</p>
          </div>
        </div>

        {turmas.length === 0 && (
          <div className={`${card} border rounded-2xl p-8 text-center mb-6`}>
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={`font-medium ${text}`}>Esta instituição ainda não tem turmas.</p>
            <p className={`text-sm ${subtext} mt-1`}>Crie uma turma em "Gerir Turmas" para gerir vagas reais.</p>
          </div>
        )}

        {turmas.length > 0 && (
          <div className={`${card} border rounded-2xl overflow-hidden mb-6`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${text} flex items-center gap-2`}>
                <GraduationCap className="w-5 h-5 text-primary-500" /> Vagas por Turma
              </h2>
              <span className={`text-xs ${subtext}`}>Ajuste as vagas de cada turma</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {turmas.map(turma => {
                const ocupadas = parseInt(turma.vagas_ocupadas) || 0;
                const vagas = parseInt(turma.vagas) || 0;
                const disp = Math.max(0, vagas - ocupadas);
                const pct = vagas > 0 ? Math.round((disp / vagas) * 100) : 0;
                return (
                  <div key={turma.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${text}`}>{turma.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          disp === 0 ? 'bg-red-100 text-red-700' : disp <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>{disp} disp.</span>
                      </div>
                      <p className={`text-xs ${subtext}`}>{turma.ano_letivo} • {ocupadas} ocupadas</p>
                      <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full ${disp === 0 ? 'bg-red-500' : disp <= 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={vagas}
                        onChange={e => mudarVagasTurma(turma.id, e.target.value)}
                        className={`w-24 px-3 py-2 rounded-xl border ${input} outline-none text-center`}
                      />
                      <button
                        onClick={() => handleSaveTurma(turma)}
                        disabled={savingTurma === turma.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {savingTurma === turma.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={`${card} border rounded-2xl p-6`}>
          <h2 className={`text-lg font-semibold ${text} mb-4`}>Total Global de Vagas da Instituição</h2>
          <p className={`text-sm ${subtext} mb-4`}>
            Este valor representa a capacidade total publicada da instituição. As matrículas (presenciais ou online) vão reduzindo
            as vagas disponíveis automaticamente.
          </p>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${subtext} mb-1`}>Vagas Totais da Instituição</label>
              <input type="number" value={vagasTotais} onChange={e => setVagasTotais(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-primary-500/20 outline-none`} min="0" />
            </div>
            <div className="w-full md:w-64 bg-gray-200 dark:bg-navy-700 rounded-full h-3 mb-2">
              <div className="bg-primary-500 h-3 rounded-full transition-all"
                style={{ width: `${vagasTotais > 0 ? Math.min(100, (disponiveisReais / vagasTotais) * 100) : 0}%` }} />
            </div>
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