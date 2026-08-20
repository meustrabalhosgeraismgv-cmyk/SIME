import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Users, ClipboardList, School, GraduationCap, Loader2, Plus,
  CheckCircle, XCircle, Clock, Calendar, RefreshCw, BookOpen,
  AlertCircle, HeartHandshake
} from 'lucide-react';
import { solicitacaoService, matriculaService, instituicaoService, turmaService, requisitoInscricaoService, authService, alunoService, classificacaoService } from '../services/api';
import { connectSocket, getSocket } from '../services/socketClient';

const ESTADO_CONFIG = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  aceite: { label: 'Aceite', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  agendado: { label: 'Agendado', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  inscrito: { label: 'Inscrito', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const AreaEncarregado = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();

  const [perfil, setPerfil] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [filhosBoletim, setFilhosBoletim] = useState([]);
  const [boletins, setBoletins] = useState({});
  const [boletimAberto, setBoletimAberto] = useState({});
  const [escolas, setEscolas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [requisitoOrigem, setRequisitoOrigem] = useState('');
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    instituicao_id: '',
    turma_id: '',
    aluno_nome: '',
    aluno_data_nascimento: '',
    aluno_sexo: 'M',
    aluno_bi: '',
    necessidades_especiais: '',
  });

  const loadAll = useCallback(async () => {
    try {
      const [perfilRes, solRes, matRes, escolaRes, filhosRes] = await Promise.all([
        authService.getPerfilCompleto().catch(() => null),
        solicitacaoService.getEncarregado().catch(() => ({ data: { data: [] } })),
        matriculaService.getEncarregado().catch(() => ({ data: { data: [] } })),
        instituicaoService.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        alunoService.getFilhos().catch(() => ({ data: { data: [] } })),
      ]);
      setPerfil(perfilRes?.data || null);
      setSolicitacoes(solRes.data.data || []);
      setMatriculas(matRes.data.data || []);
      setEscolas(escolaRes.data.data || []);
      setFilhosBoletim(filhosRes.data.data || []);

      const mapaBoletins = {};
      for (const filho of filhosRes.data.data || []) {
        if (filho.id) {
          mapaBoletins[filho.id] = await classificacaoService.getHistorico(filho.id)
            .then(r => r.data?.historico || [])
            .catch(() => []);
        }
      }
      setBoletins(mapaBoletins);

      const escolaParam = searchParams.get('escola');
      if (escolaParam) {
        setForm(f => ({ ...f, instituicao_id: escolaParam }));
        setShowForm(true);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do encarregado:', e);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const token = localStorage.getItem('sime_token');
    const socket = connectSocket(token);
    const onUpdate = (payload) => {
      if (payload && payload.encarregado_id && user?.entidade_id && payload.encarregado_id === user.entidade_id) {
        setSolicitacoes(prev => [payload, ...prev.filter(s => s.id !== payload.id)]);
        setAlertMsg({ type: 'info', message: `A sua solicitação para "${payload.aluno_nome}" mudou de estado para "${ESTADO_CONFIG[payload.estado]?.label || payload.estado}".` });
      }
    };
    socket?.on('solicitacao:update', onUpdate);
    return () => {
      socket?.off('solicitacao:update', onUpdate);
      if (getSocket()) getSocket().disconnect();
    };
  }, [user]);

  const carregarTurmas = async (instituicaoId) => {
    if (!instituicaoId) { setTurmas([]); setRequisitos([]); setDocs({}); return; }
    try {
      const res = await turmaService.getAll({ instituicao_id: instituicaoId, limit: 100 });
      const lista = (res.data.data || []).filter(t => (t.vagas || 0) - (t.vagas_ocupadas || 0) > 0);
      setTurmas(lista);
    } catch (e) { setTurmas([]); }
  };

  const carregarRequisitos = async (instituicaoId, turma) => {
    setRequisitos([]);
    setDocs({});
    if (!instituicaoId) return;
    try {
      const res = await requisitoInscricaoService.getPublica(instituicaoId);
      const config = res.data?.data || {};
      const nivel = turma?.nivel;
      const ciclo = (config.ciclos || []).find(c => nivel && (c.niveis || []).includes(nivel)) || (config.ciclos || [])[0];
      setRequisitos(ciclo?.requisitos || []);
      setRequisitoOrigem(config.estado === 'padrao' ? 'padrão do sistema' : config.estado);
    } catch (e) {
      setRequisitos([]);
      setRequisitoOrigem('');
    }
  };

  const handleInstituicaoChange = (id) => {
    setForm({ ...form, instituicao_id: id, turma_id: '' });
    setRequisitos([]);
    setDocs({});
    carregarTurmas(id);
  };

  const handleTurmaChange = (id) => {
    const turma = turmas.find(t => (t._id || t.id) === id);
    setForm({ ...form, turma_id: id });
    carregarRequisitos(form.instituicao_id, turma);
  };

  const onFileSelect = (chave, file) => {
    setDocs(prev => ({
      ...prev,
      [chave]: [...(prev[chave] || []), file]
    }));
  };

  const removerDoc = (chave, idx) => {
    setDocs(prev => ({
      ...prev,
      [chave]: (prev[chave] || []).filter((_, i) => i !== idx)
    }));
  };

  const uploadDocumentos = async () => {
    const documentos = [];
    for (const chave of Object.keys(docs)) {
      const ficheiros = docs[chave] || [];
      for (const ficheiro of ficheiros) {
        const res = await solicitacaoService.uploadDocumento(ficheiro);
        const requisito = requisitos.find(r => r.chave === chave);
        documentos.push({
          chave,
          nome: requisito?.nome || chave,
          url: res.data?.url,
          nome_ficheiro: ficheiro.name,
          tamanho: ficheiro.size
        });
      }
    }
    return documentos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instituicao_id) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    if (!form.turma_id) { setAlertMsg({ type: 'error', message: 'Selecione a turma/classe pretendida' }); return; }
    if (!form.aluno_nome.trim()) { setAlertMsg({ type: 'error', message: 'Indique o nome do aluno' }); return; }
    const obrigatorios = requisitos.filter(r => r.obrigatorio);
    for (const r of obrigatorios) {
      if (!(docs[r.chave] || []).length) {
        setAlertMsg({ type: 'error', message: `É obrigatório anexar: ${r.nome}` });
        return;
      }
    }
    setSending(true);
    setUploading(true);
    setAlertMsg(null);
    try {
      const documentos = await uploadDocumentos();
      await solicitacaoService.create({
        instituicao_id: form.instituicao_id,
        turma_id: form.turma_id || null,
        aluno_nome: form.aluno_nome,
        aluno_data_nascimento: form.aluno_data_nascimento || null,
        aluno_sexo: form.aluno_sexo,
        aluno_bi: form.aluno_bi || null,
        necessidades_especiais: form.necessidades_especiais || '',
        documentos,
      });
      setAlertMsg({ type: 'success', message: 'Solicitação de vaga enviada com sucesso! A instituição vai analisar o seu pedido.' });
      setShowForm(false);
      setForm({ instituicao_id: '', turma_id: '', aluno_nome: '', aluno_data_nascimento: '', aluno_sexo: 'M', aluno_bi: '', necessidades_especiais: '' });
      setDocs({});
      setRequisitos([]);
      loadAll();
    } catch (err) {
      setAlertMsg({ type: 'error', message: err.response?.data?.error || 'Erro ao enviar solicitação' });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const fazerMatricula = async (solicitacao) => {
    if (!confirm(`Confirmar a matrícula online de "${solicitacao.aluno_nome}" na ${solicitacao.instituicao_nome}?`)) return;
    setSending(true);
    try {
      const res = await matriculaService.createEncarregado({ solicitacao_id: solicitacao.id });
      setAlertMsg({ type: 'success', message: `Matrícula realizada! Nº de estudante: ${res.data.numero_estudante}` });
      loadAll();
    } catch (err) {
      setAlertMsg({ type: 'error', message: err.response?.data?.error || 'Erro ao fazer a matrícula' });
    } finally {
      setSending(false);
    }
  };

  const getProximoPasso = (sol) => {
    if (sol.estado === 'pendente') return 'A aguardar análise da instituição...';
    if (sol.estado === 'aceite') return 'Solicitação aceite! Pode avançar para a matrícula.';
    if (sol.estado === 'inscrito') return 'Matrícula concluída. Bem-vindo!';
    if (sol.estado === 'rejeitada') return 'Solicitação recusada. Contacte a instituição.';
    if (sol.estado === 'agendado') return 'Entrevista/pagamento agendado. Após concluir, poderá fazer a matrícula.';
    return '';
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  const alunos = perfil?.dados_vinculados?.alunos || [];
  const totalPendentes = solicitacoes.filter(s => s.estado === 'pendente').length;
  const totalAceites = solicitacoes.filter(s => s.estado === 'aceite' || s.estado === 'agendado').length;
  const escolaSelecionada = escolas.find(e => (e._id || e.id) === form.instituicao_id);

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Área do Encarregado</h1>
              <p className={`text-sm ${subtext}`}>Solicite vagas, acompanhe os seus educandos e complete a matrícula online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" /> Solicitar Vaga
            </button>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            alertMsg.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : alertMsg.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          }`}>
            <AlertCircle className={`w-5 h-5 ${alertMsg.type === 'success' ? 'text-green-600' : alertMsg.type === 'error' ? 'text-red-600' : 'text-blue-600'}`} />
            <p className={`text-sm font-medium ${alertMsg.type === 'success' ? 'text-green-700' : alertMsg.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>{alertMsg.message}</p>
            <button onClick={() => setAlertMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${card} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{alunos.length}</p>
            <p className={`text-sm ${subtext}`}>Educandos</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center border-t-4 border-t-amber-500`}>
            <p className="text-3xl font-bold text-amber-600">{totalPendentes}</p>
            <p className={`text-sm ${subtext}`}>Vagas Pendentes</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center border-t-4 border-t-green-500`}>
            <p className="text-3xl font-bold text-green-600">{totalAceites}</p>
            <p className={`text-sm ${subtext}`}>Vagas Aceites</p>
          </div>
          <div className={`${card} border rounded-2xl p-5 text-center border-t-4 border-t-purple-500`}>
            <p className="text-3xl font-bold text-purple-600">{matriculas.length}</p>
            <p className={`text-sm ${subtext}`}>Matrículas Feitas</p>
          </div>
        </div>

        {/* Nova Solicitação form */}
        {showForm && (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${text}`}>Nova Solicitação de Vaga</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {escolaSelecionada && (
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-3">
                    <School className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className={`text-sm font-semibold ${text}`}>{escolaSelecionada.nome}</p>
                      <p className={`text-xs ${subtext}`}>{escolaSelecionada.municipio_nome} • {escolaSelecionada.tipo}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Instituição *</label>
                  <select value={form.instituicao_id} onChange={e => handleInstituicaoChange(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} required>
                    <option value="">Selecione a instituição...</option>
                    {escolas.map(e => (
                      <option key={e._id || e.id} value={e._id || e.id}>{e.nome} — {e.municipio_nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Turma / Classe Pretendida *</label>
                  <select value={form.turma_id} onChange={e => handleTurmaChange(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} required>
                    <option value="">Selecione...</option>
                    {turmas.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.nome} — {(c.vagas || 0) - (c.vagas_ocupadas || 0)} vagas
                      </option>
                    ))}
                  </select>
                  {turmas.length === 0 && (
                    <p className={`text-xs mt-1 ${subtext}`}>A instituição selecionada ainda não tem turmas com vagas disponíveis.</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Nome Completo do Aluno *</label>
                  <input type="text" value={form.aluno_nome} onChange={e => setForm({ ...form, aluno_nome: e.target.value })} required
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="Nome completo do educando" />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Bilhete de Identidade do Aluno</label>
                  <input type="text" value={form.aluno_bi} onChange={e => setForm({ ...form, aluno_bi: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="Opcional" />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Data de Nascimento</label>
                  <input type="date" value={form.aluno_data_nascimento} onChange={e => setForm({ ...form, aluno_data_nascimento: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Sexo</label>
                  <select value={form.aluno_sexo} onChange={e => setForm({ ...form, aluno_sexo: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
              {form.turma_id && (
                <div className={`p-4 rounded-xl border ${requisitos.length ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h3 className={`text-sm font-semibold ${text}`}>Documentos exigidos para a inscrição</h3>
                  </div>
                  <p className={`text-xs ${subtext} mb-3`}>
                    Requisitos definidos pela instituição{requisitoOrigem ? ` (${requisitoOrigem})` : ''}. Anexe os ficheiros (PDF, JPG ou PNG).
                  </p>
                  {requisitos.length === 0 ? (
                    <p className={`text-xs ${subtext}`}>Nenhum documento exigido para esta turma.</p>
                  ) : (
                    <div className="space-y-3">
                      {requisitos.map(r => {
                        const ficheiros = docs[r.chave] || [];
                        return (
                          <div key={r.chave} className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${text}`}>
                                {r.nome} {r.obrigatorio ? <span className="text-red-500">*</span> : <span className={`text-xs ${subtext}`}>(opcional)</span>}
                              </p>
                              {r.descricao && <p className={`text-xs ${subtext}`}>{r.descricao}</p>}
                              {ficheiros.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {ficheiros.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      {f.name}
                                      <button type="button" onClick={() => removerDoc(r.chave, i)} className="hover:text-red-600">✕</button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${card} ${text} hover:bg-primary-50 dark:hover:bg-navy-700`}>
                              <Plus className="w-3.5 h-3.5" /> {ficheiros.length ? 'Adicionar' : 'Anexar'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                onChange={e => {
                                  const f = e.target.files && e.target.files[0];
                                  if (f) onFileSelect(r.chave, f);
                                  e.target.value = '';
                                }} />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1 flex items-center gap-1`}>
                  <HeartHandshake className="w-4 h-4 text-primary-500" /> Necessidades Educativas Especiais
                </label>
                <input type="text" value={form.necessidades_especiais} onChange={e => setForm({ ...form, necessidades_especiais: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}
                  placeholder="Ex: deficiência motora, visual, auditiva, autismo... (se aplicável)" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded-xl border ${input} ${text} text-sm`}>Cancelar</button>
                <button type="submit" disabled={sending || uploading}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {(sending || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? 'A enviar documentos...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Os Meus Alunos */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
            <h2 className={`text-lg font-semibold ${text} flex items-center gap-2`}>
              <Users className="w-5 h-5 text-primary-500" /> Os Meus Educandos ({alunos.length})
            </h2>
          </div>
          {alunos.length === 0 ? (
            <div className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={subtext}>Ainda não tem educandos registados. Solicite uma vaga para começar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {alunos.map(a => (
                <div key={a.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${text}`}>{a.nome_completo}</p>
                    <p className={`text-sm ${subtext}`}>{a.numero_estudante}</p>
                    <p className="text-xs text-primary-500 mt-0.5 flex items-center gap-1">
                      <School className="w-3 h-3" /> {a.instituicao_nome || 'Sem instituição'}
                    </p>
                    {a.necessidades_especiais && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <HeartHandshake className="w-3 h-3" /> {a.necessidades_especiais}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.estado === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Boletim Escolar */}
        {filhosBoletim.length > 0 && (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className={`text-lg font-semibold ${text}`}>Boletim Escolar dos Meus Educandos</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {filhosBoletim.map(filho => {
                const lista = filho.classificacoes || boletins[filho.id] || [];
                const isOpen = !!boletimAberto[filho.id];
                const maisRecente = lista[0];
                return (
                  <div key={filho.id} className="p-4">
                    <button
                      onClick={() => setBoletimAberto(prev => ({ ...prev, [filho.id]: !prev[filho.id] }))}
                      className="w-full flex items-start justify-between gap-4 text-left"
                    >
                      <div>
                        <p className={`font-semibold ${text}`}>{filho.nome_completo}</p>
                        <p className={`text-sm ${subtext}`}>Nº {filho.numero_estudante}</p>
                        {maisRecente && (
                          <p className={`mt-1 text-xs ${subtext}`}>
                            Último boletim: <span className="font-medium text-primary-500 capitalize">{maisRecente.classe}</span> •{' '}
                            média <span className={`font-bold ${parseFloat(maisRecente.media_geral) >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                              {parseFloat(maisRecente.media_geral).toFixed(1)}
                            </span> •{' '}
                            <span className={maisRecente.estado === 'aprovado' ? 'text-green-600' : 'text-red-500'}>
                              {maisRecente.estado === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                            </span>
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${isOpen ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isOpen ? 'Fechar' : `${lista.length} boletim(ins)`}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-3 space-y-3">
                        {lista.length === 0 && (
                          <p className={`text-sm ${subtext}`}>Sem boletins lançados pela instituição.</p>
                        )}
                        {lista.map((c, i) => (
                          <div key={i} className="p-4 bg-gray-50 dark:bg-navy-800 rounded-2xl">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <p className={`font-medium capitalize ${text}`}>{c.classe} • {c.ano_letivo} • {String(c.periodo || 'anual').replace('_', ' ')}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {c.estado === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {(c.disciplinas || []).map((d, di) => (
                                <div key={di} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-navy-700 rounded-lg">
                                  <span className="text-xs text-gray-600 dark:text-gray-300">{d.nome}</span>
                                  <span className={`text-xs font-bold ${parseFloat(d.nota ?? d.nota_final) >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                                    {parseFloat(d.nota ?? d.nota_final).toFixed(1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                              Média Final: <span className={parseFloat(c.media_geral) >= 10 ? 'text-green-600' : 'text-red-500'}>{parseFloat(c.media_geral).toFixed(1)}</span>
                            </p>
                            {c.observacoes && <p className={`mt-1 text-xs ${subtext}`}>{c.observacoes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Solicitações */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
            <h2 className={`text-lg font-semibold ${text} flex items-center gap-2`}>
              <ClipboardList className="w-5 h-5 text-primary-500" /> As Minhas Solicitações ({solicitacoes.length})
            </h2>
          </div>
          {solicitacoes.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={subtext}>Ainda não fez nenhuma solicitação de vaga.</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-semibold text-primary-500 hover:underline">Solicitar uma vaga agora</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {solicitacoes.map(sol => {
                const config = ESTADO_CONFIG[sol.estado] || ESTADO_CONFIG.pendente;
                const Icon = config.icon;
                return (
                  <div key={sol.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${text}`}>{sol.aluno_nome}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            <Icon className="w-3 h-3" /> {config.label}
                          </span>
                        </div>
                        <p className={`text-sm ${subtext} mt-1`}>
                          <School className="w-3.5 h-3.5 inline mr-1" /> {sol.instituicao_nome || '—'}
                          {sol.turma_nome && <span className="text-primary-500 font-medium"> • {sol.turma_nome}</span>}
                        </p>
                        <p className={`text-xs ${subtext}`}>{new Date(sol.created_at).toLocaleDateString('pt-AO')}</p>
                        {(sol.documentos || []).length > 0 && (
                          <p className={`mt-1 text-xs ${subtext}`}>
                            Documentos anexados: {sol.documentos.length} ({sol.documentos.map(d => d.nome).join(', ')})
                          </p>
                        )}
                        {sol.necessidades_especiais && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <HeartHandshake className="w-3 h-3" /> {sol.necessidades_especiais}
                          </span>
                        )}
                        {sol.observacoes && (
                          <p className={`mt-2 text-xs ${subtext} bg-gray-50 dark:bg-navy-700 px-3 py-2 rounded-lg`}>
                            <strong>Observação:</strong> {sol.observacoes}
                          </p>
                        )}
                        <p className={`mt-2 text-xs font-medium ${sol.estado === 'rejeitada' ? 'text-red-500' : sol.estado === 'aceite' ? 'text-green-600' : 'text-primary-500'}`}>
                          {getProximoPasso(sol)}
                        </p>
                      </div>
                      {(sol.estado === 'aceite' || sol.estado === 'agendado') && (
                        <button onClick={() => fazerMatricula(sol)} disabled={sending}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                          <BookOpen className="w-4 h-4" /> Fazer Matrícula Online
                        </button>
                      )}
                    </div>
                    {(sol.historico || []).length > 0 && (
                      <div className="mt-3 flex items-center gap-1 flex-wrap">
                        {sol.historico.map((h, i) => {
                          const hc = ESTADO_CONFIG[h.estado] || ESTADO_CONFIG.pendente;
                          const HIcon = hc.icon;
                          const isLast = i === sol.historico.length - 1;
                          return (
                            <div key={i} className="flex items-center gap-1">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${hc.bg} ${hc.color} ${isLast ? 'ring-2 ring-primary-200' : 'opacity-70'}`}>
                                <HIcon className="w-3 h-3" /> {hc.label}
                              </div>
                              {!isLast && <span className="text-gray-400 text-xs">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Matrículas */}
        {matriculas.length > 0 && (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
              <h2 className={`text-lg font-semibold ${text} flex items-center gap-2`}>
                <BookOpen className="w-5 h-5 text-purple-500" /> As Minhas Matrículas ({matriculas.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {matriculas.map(m => (
                <div key={m.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className={`font-semibold ${text}`}>{m.aluno_nome}</p>
                    <p className={`text-sm ${subtext}`}>Nº {m.numero_estudante}</p>
                    <p className="text-xs text-primary-500 mt-0.5"><School className="w-3 h-3 inline mr-1" />{m.instituicao_nome}</p>
                    {m.turma_nome && <p className={`text-xs ${subtext}`}>Turma: {m.turma_nome} • {m.ano_letivo}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Ativa</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to Pesquisar Escolas */}
        <div className="text-center">
          <Link to="/app/pesquisar-escolas" className="text-sm font-semibold text-primary-500 hover:underline inline-flex items-center gap-1">
            <School className="w-4 h-4" /> Pesquisar mais escolas
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AreaEncarregado;