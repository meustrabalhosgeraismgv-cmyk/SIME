import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Loader2, Save, Search, ListChecks } from 'lucide-react';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import StatusChip from '../components/StatusChip';
import { turmaService, classificacaoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DISCIPLINAS_PRIMARIO = ['Português', 'Matemática', 'Estudo do Meio', 'Ciências Naturais', 'Educação Física', 'Oficina de Leitura'];
const DISCIPLINAS_SECUNDARIO = ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'Geografia', 'História', 'Inglês', 'Francês', 'Educação Física'];

const getDisciplinas = (nivel) => {
  const num = parseInt(String(nivel || '').replace(/\D/g, ''));
  return num >= 7 ? DISCIPLINAS_SECUNDARIO : DISCIPLINAS_PRIMARIO;
};

const getClasse = (nivel) => String(nivel || '').replace('_classe', '').replace('classe', '');

const PERIODOS = [
  { value: '1o_periodo', label: '1º Período' },
  { value: '2o_periodo', label: '2º Período' },
  { value: '3o_periodo', label: '3º Período' },
  { value: 'anual', label: 'Anual' }
];

const Classificacoes = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('lancar');
  const [turmas, setTurmas] = useState([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [alunosTurma, setAlunosTurma] = useState([]);
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState('anual');
  const [notas, setNotas] = useState({});
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [guardando, setGuardando] = useState(null);
  const [alert, setAlert] = useState(null);
  const [boletins, setBoletins] = useState([]);
  const [loadingBoletins, setLoadingBoletins] = useState(false);
  const [searchBoletim, setSearchBoletim] = useState('');

  const isGestor = user?.perfil === 'instituicao';

  useEffect(() => {
    const loadTurmas = async () => {
      try {
        setLoadingTurmas(true);
        const res = await turmaService.getAll({
          limit: 100,
          instituicao_id: isGestor ? user?.entidade_id : ''
        });
        setTurmas(res.data.data || []);
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
      } finally {
        setLoadingTurmas(false);
      }
    };
    loadTurmas();
  }, []);

  useEffect(() => {
    if (tab === 'boletins') loadBoletins();
  }, [tab]);

  const loadBoletins = async () => {
    try {
      setLoadingBoletins(true);
      const res = await classificacaoService.getAll({ limit: 100 });
      setBoletins(res.data.data || []);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao carregar boletins' });
    } finally {
      setLoadingBoletins(false);
    }
  };

  const handleTurmaChange = async (turmaId) => {
    setSelectedTurmaId(turmaId);
    setNotas({});
    setAlunosTurma([]);
    setSelectedTurma(null);
    if (!turmaId) return;
    try {
      setLoadingAlunos(true);
      const res = await turmaService.getById(turmaId);
      setSelectedTurma(res.data);
      setAlunosTurma(res.data.alunos || []);
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao carregar alunos da turma' });
    } finally {
      setLoadingAlunos(false);
    }
  };

  const setNota = (alunoId, disciplina, valor) => {
    const n = valor === '' ? '' : Math.max(0, Math.min(20, parseFloat(valor) || 0));
    setNotas(prev => ({
      ...prev,
      [alunoId]: { ...(prev[alunoId] || {}), [disciplina]: n }
    }));
  };

  const calcularMedia = (alunoId, disciplinas) => {
    const vals = disciplinas.map(d => parseFloat(notas[alunoId]?.[d])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  };

  const guardarBoletim = async (aluno) => {
    const disciplinas = getDisciplinas(selectedTurma?.nivel);
    const valores = disciplinas.map(d => ({ nome: d, nota: parseFloat(notas[aluno.id]?.[d]) })).filter(x => !isNaN(x.nota));
    if (valores.length === 0) {
      setAlert({ type: 'error', message: `Insira pelo menos uma nota para ${aluno.nome_completo}` });
      return;
    }
    const media = Math.round((valores.reduce((a, b) => a + b.nota, 0) / valores.length) * 100) / 100;
    setGuardando(aluno.id);
    setAlert(null);
    try {
      const classe = getClasse(selectedTurma?.nivel);
      await classificacaoService.create({
        aluno_id: aluno.id,
        classe,
        ano_letivo: anoLetivo,
        periodo,
        disciplinas: valores,
        media_geral: media,
        estado: media >= 10 ? 'aprovado' : 'reprovado'
      });
      setAlert({ type: 'success', message: `Boletim de ${aluno.nome_completo} lançado e comunicado ao encarregado por SMS` });
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar boletim' });
    } finally {
      setGuardando(null);
    }
  };

  const disciplinas = selectedTurma ? getDisciplinas(selectedTurma.nivel) : [];
  const classe = selectedTurma ? getClasse(selectedTurma.nivel) : '';

  const boletinsFiltrados = boletins.filter(b =>
    !searchBoletim || (b.aluno_nome || '').toLowerCase().includes(searchBoletim.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-gray-900 dark:text-white text-center outline-none focus:border-primary-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Classificações / Pautas</h2>
        <p className="text-gray-500 dark:text-gray-400">Lance as notas por turma — o boletim é remetido ao encarregado via SMS</p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('lancar')}
          className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 flex items-center gap-2 transition-colors ${
            tab === 'lancar' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Lançar Notas
        </button>
        <button
          onClick={() => setTab('boletins')}
          className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 flex items-center gap-2 transition-colors ${
            tab === 'boletins' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListChecks className="w-4 h-4" /> Boletins Lançados
        </button>
      </div>

      {tab === 'lancar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turma *</label>
                <select value={selectedTurmaId} onChange={e => handleTurmaChange(e.target.value)} className="input-field">
                  <option value="">Selecione a turma...</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} — {t.nivel} ({t.vagas_ocupadas}/{t.vagas})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano Letivo</label>
                <input type="number" value={anoLetivo} onChange={e => setAnoLetivo(e.target.value)} className="input-field" min="2020" max="2035" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
                <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-field">
                  {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loadingTurmas && <Loading />}

          {!loadingTurmas && !selectedTurmaId && (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-10 text-center">
              <GraduationCap className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Selecione uma turma para lançar as notas.</p>
            </div>
          )}

          {selectedTurmaId && loadingAlunos && <Loading />}

          {selectedTurma && !loadingAlunos && (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTurma.nome} — {classe} • {anoLetivo} • {PERIODOS.find(p => p.value === periodo)?.label}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{alunosTurma.length} alunos</span>
              </div>
              {alunosTurma.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Sem alunos matriculados nesta turma.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="min-w-[180px]">Aluno</th>
                        {disciplinas.map(d => (
                          <th key={d} className="min-w-[90px] text-center">{d}</th>
                        ))}
                        <th className="text-center">Média</th>
                        <th className="text-center">Situação</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosTurma.map(aluno => {
                        const media = calcularMedia(aluno.id, disciplinas);
                        const preenchidas = disciplinas.filter(d => notas[aluno.id]?.[d] !== undefined && notas[aluno.id]?.[d] !== '').length;
                        return (
                          <tr key={aluno.id}>
                            <td>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{aluno.nome_completo}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{aluno.numero_estudante}</p>
                            </td>
                            {disciplinas.map(d => (
                              <td key={d} className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.1"
                                  value={notas[aluno.id]?.[d] ?? ''}
                                  onChange={e => setNota(aluno.id, d, e.target.value)}
                                  className={inputCls}
                                  placeholder="-"
                                />
                              </td>
                            ))}
                            <td className="text-center font-bold text-gray-900 dark:text-white">
                              {media !== null ? media.toFixed(1) : '—'}
                            </td>
                            <td className="text-center">
                              {media !== null ? (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${media >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {media >= 10 ? 'Aprovado' : 'Reprovado'}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() => guardarBoletim(aluno)}
                                disabled={guardando === aluno.id || preenchidas === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium disabled:opacity-40"
                              >
                                {guardando === aluno.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Lançar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'boletins' && (
        <div className="space-y-6">
          <form onSubmit={(e) => e.preventDefault()} className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchBoletim}
                  onChange={(e) => setSearchBoletim(e.target.value)}
                  placeholder="Pesquisar boletim por aluno..."
                  className="input-field pl-10"
                />
              </div>
              <button type="button" onClick={loadBoletins} className="btn-primary">
                Atualizar
              </button>
            </div>
          </form>

          {loadingBoletins ? (
            <Loading />
          ) : boletinsFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-10 text-center">
              <ListChecks className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Ainda não foram lançados boletins.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Classe</th>
                      <th>Ano Letivo</th>
                      <th>Período</th>
                      <th>Média</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletinsFiltrados.map(b => (
                      <tr key={b._id || b.id}>
                        <td className="font-medium text-gray-900 dark:text-white">{b.aluno_nome}</td>
                        <td className="capitalize">{b.classe}</td>
                        <td>{b.ano_letivo}</td>
                        <td className="capitalize">{String(b.periodo || '').replace('_', ' ')}</td>
                        <td className={`font-bold ${parseFloat(b.media_geral) >= 10 ? 'text-success' : 'text-error'}`}>
                          {parseFloat(b.media_geral).toFixed(1)}
                        </td>
                        <td>
                          <StatusChip status={b.estado === 'aprovado' ? 'ativo' : 'abandono'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Classificacoes;