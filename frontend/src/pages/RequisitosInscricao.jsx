import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  FileText, Loader2, Save, CheckCircle, Sparkles, Plus, Trash2, Building2, Bell, Wallet, ClipboardCheck, AlertCircle
} from 'lucide-react';
import {
  requisitoInscricaoService, requisitoMatriculaService, configuracaoFinanceiraService, instituicaoService
} from '../services/api';

const CICLOS_META = {
  primario: { nome: 'Ensino Primário', descricao: '1ª a 6ª classe' },
  secundario: { nome: 'I Ciclo do Ensino Secundário', descricao: '7ª a 9ª classe' },
  medio: { nome: 'Ensino Médio (II Ciclo)', descricao: '10ª a 13ª classe' },
};

const FICHAPADRAO = { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };

function CiclosEditor({ ciclos, setCiclos }) {
  const { theme } = useTheme();
  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  const atualizarRequisito = (cicloIdx, reqIdx, campo, valor) => {
    const lista = [...ciclos];
    const requisitos = [...(lista[cicloIdx].requisitos || [])];
    requisitos[reqIdx] = { ...requisitos[reqIdx], [campo]: valor };
    lista[cicloIdx] = { ...lista[cicloIdx], requisitos };
    setCiclos(lista);
  };

  const adicionarRequisito = (cicloIdx) => {
    const lista = [...ciclos];
    lista[cicloIdx] = { ...lista[cicloIdx], requisitos: [...(lista[cicloIdx].requisitos || []), { chave: `req_${Date.now()}`, nome: '', descricao: '', obrigatorio: true, aceita_pdf: true }] };
    setCiclos(lista);
  };

  const removerRequisito = (cicloIdx, reqIdx) => {
    const lista = [...ciclos];
    lista[cicloIdx] = { ...lista[cicloIdx], requisitos: (lista[cicloIdx].requisitos || []).filter((_, i) => i !== reqIdx) };
    setCiclos(lista);
  };

  return (
    <>
      {(ciclos || []).map((ciclo, cicloIdx) => {
        const meta = CICLOS_META[ciclo.ciclo] || { nome: ciclo.nome || ciclo.ciclo, descricao: '' };
        return (
          <div key={ciclo.ciclo} className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${text}`}>{meta.nome}</h2>
                <p className={`text-xs ${subtext}`}>{meta.descricao}{ciclo.niveis?.length ? ` • ${ciclo.niveis.map(n => n.replace('_classe', 'ª classe')).join(', ')}` : ''}</p>
              </div>
              <button onClick={() => adicionarRequisito(cicloIdx)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="p-6 space-y-3">
              {(ciclo.requisitos || []).length === 0 && (
                <p className={`text-sm ${subtext}`}>Nenhum documento definido para este ciclo.</p>
              )}
              {(ciclo.requisitos || []).map((req, reqIdx) => (
                <div key={req.chave || reqIdx} className={`p-4 rounded-xl border ${card} space-y-2`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Nome do documento *</label>
                      <input type="text" value={req.nome}
                        onChange={e => atualizarRequisito(cicloIdx, reqIdx, 'nome', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${input} outline-none text-sm`}
                        placeholder="Ex: Bilhete de Identidade do Aluno" required />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Descrição (opcional)</label>
                      <input type="text" value={req.descricao || ''}
                        onChange={e => atualizarRequisito(cicloIdx, reqIdx, 'descricao', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${input} outline-none text-sm`}
                        placeholder="Ex: BI ou Certidão de Nascimento" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className={`flex items-center gap-2 text-xs ${text}`}>
                      <input type="checkbox" checked={!!req.obrigatorio}
                        onChange={e => atualizarRequisito(cicloIdx, reqIdx, 'obrigatorio', e.target.checked)}
                        className="w-4 h-4" />
                      Obrigatório
                    </label>
                    <label className={`flex items-center gap-2 text-xs ${text}`}>
                      <input type="checkbox" checked={!!req.aceita_pdf}
                        onChange={e => atualizarRequisito(cicloIdx, reqIdx, 'aceita_pdf', e.target.checked)}
                        className="w-4 h-4" />
                      Aceita PDF
                    </label>
                    <button onClick={() => removerRequisito(cicloIdx, reqIdx)}
                      className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function CampoMoeda({ label, valor, onChange, subtext, input, ativo, onAtivo }) {
  return (
    <div className={`p-4 rounded-xl border ${ativo ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className={`text-sm font-medium flex items-center gap-2`}>
          <input type="checkbox" checked={!!ativo} onChange={e => onAtivo(e.target.checked)} className="w-4 h-4" />
          {label}
        </label>
        {ativo && (
          <span className={`text-xs ${subtext}`}>Valor em Kwanzas (Kz)</span>
        )}
      </div>
      <input
        type="number" min="0" step="0.01"
        value={valor}
        onChange={e => onChange(e.target.value)}
        disabled={!ativo}
        placeholder="0,00"
        className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${ativo ? '' : 'opacity-50 cursor-not-allowed'}`}
      />
    </div>
  );
}

const RequisitosInscricao = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [aba, setAba] = useState('inscricao');
  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoId, setInstituicaoId] = useState('');
  const [configInscricao, setConfigInscricao] = useState(null);
  const [configMatricula, setConfigMatricula] = useState(null);
  const [financas, setFinancas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const isAdmin = user?.perfil === 'admin';
  const eInstituicao = user?.perfil === 'instituicao';

  const loadTudo = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [ins, mat, fin] = await Promise.all([
        requisitoInscricaoService.getMinha(id).then(r => r.data?.data || null).catch(() => null),
        requisitoMatriculaService.getMinha(id).then(r => r.data?.data || null).catch(() => null),
        configuracaoFinanceiraService.getMinha(id).then(r => r.data?.data || null).catch(() => null),
      ]);
      setConfigInscricao(ins);
      setConfigMatricula(mat);
      setFinancas(fin);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eInstituicao) {
      setInstituicaoId(user?.entidade_id || '');
      loadTudo(user?.entidade_id);
    } else if (isAdmin) {
      instituicaoService.getAll({ limit: 100 })
        .then(r => setInstituicoes(r.data.data || []))
        .catch(() => setInstituicoes([]));
    }
  }, [eInstituicao, isAdmin, user, loadTudo]);

  useEffect(() => {
    if (isAdmin && instituicaoId) loadTudo(instituicaoId);
  }, [isAdmin, instituicaoId, loadTudo]);

  const gerarComAssistente = async () => {
    if (!instituicaoId) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    setGerando(true);
    setAlertMsg(null);
    try {
      if (aba === 'matricula') {
        const res = await requisitoMatriculaService.gerarComAssistente(instituicaoId, Object.keys(CICLOS_META));
        const gerado = res.data?.data;
        setConfigMatricula(prev => ({ ...(prev || {}), instituicao_id: gerado.instituicao_id, ciclos: gerado.ciclos, estado: 'rascunho' }));
        setAlertMsg({ type: 'success', message: gerado.mensagem || 'Requisitos de matrícula gerados pelo assistente.' });
      } else {
        const res = await requisitoInscricaoService.gerarComAssistente(instituicaoId, Object.keys(CICLOS_META));
        const gerado = res.data?.data;
        setConfigInscricao(prev => ({ ...(prev || {}), instituicao_id: gerado.instituicao_id, ciclos: gerado.ciclos, estado: 'rascunho' }));
        setAlertMsg({ type: 'success', message: gerado.mensagem || 'Requisitos gerados pelo assistente. Reveja e guarde.' });
      }
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao gerar requisitos' });
    } finally {
      setGerando(false);
    }
  };

  const guardar = async (aprovar = false) => {
    if (!instituicaoId) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    const config = aba === 'matricula' ? configMatricula : configInscricao;
    if (!config || !config.ciclos || config.ciclos.length === 0) {
      setAlertMsg({ type: 'error', message: 'Sem ciclos para guardar. Gere com o assistente ou edite antes.' });
      return;
    }
    setSaving(true);
    setAlertMsg(null);
    try {
      const service = aba === 'matricula' ? requisitoMatriculaService : requisitoInscricaoService;
      if (aprovar) {
        await service.salvar(instituicaoId, { ciclos: config.ciclos, estado: 'aprovada' });
        const res = await service.aprovar(instituicaoId);
        setAlertMsg({ type: 'success', message: res.data?.message || 'Configuração aprovada e comunicado publicado' });
      } else {
        await service.salvar(instituicaoId, { ciclos: config.ciclos, estado: 'rascunho' });
        setAlertMsg({ type: 'success', message: 'Configuração guardada como rascunho. Aprove para publicar o comunicado.' });
      }
      loadTudo(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao guardar configuração' });
    } finally {
      setSaving(false);
    }
  };

  const atualizarFormulario = (campo, valor) => {
    setConfigInscricao(prev => {
      if (!prev) return prev;
      const formulario = { ...(prev.formulario || FICHAPADRAO), [campo]: valor };
      return { ...prev, formulario };
    });
  };

  const adicionarCampo = () => {
    const formulario = configInscricao?.formulario || FICHAPADRAO;
    atualizarFormulario('campos', [...(formulario.campos || []), { chave: `campo_${Date.now()}`, label: '', tipo: 'text', opcoes: [], obrigatorio: true }]);
  };

  const atualizarCampo = (idx, campo, valor) => {
    const formulario = configInscricao?.formulario || FICHAPADRAO;
    const campos = [...(formulario.campos || [])];
    campos[idx] = { ...campos[idx], [campo]: valor };
    atualizarFormulario('campos', campos);
  };

  const removerCampo = (idx) => {
    const formulario = configInscricao?.formulario || FICHAPADRAO;
    atualizarFormulario('campos', (formulario.campos || []).filter((_, i) => i !== idx));
  };

  const uploadModelo = async (file) => {
    if (!instituicaoId || !file) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      await requisitoInscricaoService.uploadModelo(instituicaoId, file);
      setAlertMsg({ type: 'success', message: 'Modelo da ficha carregado. Os encarregados farão download e devolverão preenchido.' });
      loadTudo(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao carregar o modelo' });
    } finally {
      setSaving(false);
    }
  };

  const removerModelo = async () => {
    if (!instituicaoId) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      await requisitoInscricaoService.removerModelo(instituicaoId);
      setAlertMsg({ type: 'success', message: 'Modelo removido. A ficha será preenchida no site.' });
      loadTudo(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao remover o modelo' });
    } finally {
      setSaving(false);
    }
  };

  const salvarFinanceiro = async () => {
    if (!instituicaoId) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    setSaving(true);
    setAlertMsg(null);
    try {
      await configuracaoFinanceiraService.salvar(instituicaoId, financas);
      setAlertMsg({ type: 'success', message: 'Configuração financeira guardada. Estes valores vigoram na inscrição, matrícula e mensalidades.' });
      loadTudo(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao guardar configuração financeira' });
    } finally {
      setSaving(false);
    }
  };

  const setFin = (campo, chave, valor) => {
    setFinancas(prev => {
      const base = prev || {};
      const grupo = { ...(base[campo] || {}), [chave]: valor };
      return { ...base, [campo]: grupo };
    });
  };

  const formulario = configInscricao?.formulario || FICHAPADRAO;
  const configAtual = aba === 'matricula' ? configMatricula : configInscricao;

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

  const tabs = [
    { id: 'inscricao', label: 'Inscrição', icon: FileText, desc: 'Requisitos e ficha de inscrição' },
    { id: 'matricula', label: 'Matrícula', icon: ClipboardCheck, desc: 'Requisitos para efetivar a matrícula' },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet, desc: 'Emolumentos, mensalidades e comparticipação' },
  ];

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Processo de Admissão & Matrícula</h1>
              <p className={`text-sm ${subtext}`}>Requisitos de inscrição, matrícula e condições financeiras que a instituição define</p>
            </div>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            alertMsg.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <CheckCircle className={`w-5 h-5 ${alertMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-sm font-medium ${alertMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertMsg.message}</p>
            <button onClick={() => setAlertMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        <div className={`${card} border rounded-2xl p-2 flex flex-col md:flex-row gap-1`}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = aba === t.id;
            return (
              <button key={t.id} onClick={() => setAba(t.id)}
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all ${active ? 'bg-primary-500 text-white shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-navy-700'}`}>
                <Icon className="w-4 h-4" />
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-white' : text}`}>{t.label}</p>
                  <p className={`text-[11px] ${active ? 'text-white/70' : subtext}`}>{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className={`${card} border rounded-2xl p-5`}>
            <label className={`block text-sm font-medium ${subtext} mb-1 flex items-center gap-1`}>
              <Building2 className="w-4 h-4 text-primary-500" /> Instituição *
            </label>
            <select value={instituicaoId} onChange={e => setInstituicaoId(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}>
              <option value="">Selecione a instituição...</option>
              {instituicoes.map(i => (
                <option key={i._id || i.id} value={i._id || i.id}>{i.nome} — {i.municipio_nome}</option>
              ))}
            </select>
          </div>
        )}

        {aba !== 'financeiro' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={gerarComAssistente} disabled={gerando || !instituicaoId}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar com Assistente
            </button>
            <button onClick={() => guardar(false)} disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 border ${card} ${text} rounded-xl text-sm font-medium disabled:opacity-50`}>
              <Save className="w-4 h-4" /> Guardar Rascunho
            </button>
            <button onClick={() => guardar(true)} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              <Bell className="w-4 h-4" /> Aprovar & Publicar Comunicado
            </button>
          </div>
        )}

        {aba !== 'financeiro' && configAtual && configAtual.estado && (
          <div className={`p-4 rounded-xl border ${
            configAtual.estado === 'aprovada' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : configAtual.estado === 'padrao' ? 'bg-gray-50 border-gray-200 dark:bg-navy-800 dark:border-navy-700'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          }`}>
            <p className={`text-sm font-medium ${text}`}>
              Estado: <span className="capitalize font-bold">{configAtual.estado === 'padrao' ? 'Padrão do sistema' : configAtual.estado}</span>
            </p>
            {configAtual.estado !== 'aprovada' && (
              <p className={`text-xs ${subtext}`}>Após aprovar, o sistema cria automaticamente um comunicado visível para toda a comunidade.</p>
            )}
          </div>
        )}

        {aba === 'inscricao' && (
          <>
            <div className={`${card} border rounded-2xl overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
                <h2 className={`text-lg font-semibold ${text}`}>Ficha de Inscrição Interna</h2>
                <p className={`text-xs ${subtext}`}>Como os encarregados entregam a ficha de inscrição: modelo próprio da instituição (download + devolução preenchida) ou preenchimento direto no site.</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={() => atualizarFormulario('modo', 'modelo')}
                    className={`p-4 rounded-xl border text-left ${formulario.modo === 'modelo' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : card}`}>
                    <p className={`text-sm font-semibold ${text}`}>Modelo próprio da instituição</p>
                    <p className={`text-xs ${subtext} mt-1`}>A instituição carrega a ficha; o encarregado faz o download, preenche e devolve o documento preenchido.</p>
                  </button>
                  <button onClick={() => atualizarFormulario('modo', 'online')}
                    className={`p-4 rounded-xl border text-left ${formulario.modo === 'online' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : card}`}>
                    <p className={`text-sm font-semibold ${text}`}>Definir no site (preenchimento online)</p>
                    <p className={`text-xs ${subtext} mt-1`}>A ficha é preenchida no site pelo encarregado — não é necessário carregar novamente o formulário.</p>
                  </button>
                </div>

                {formulario.modo === 'modelo' && (
                  <div className={`p-4 rounded-xl border ${card}`}>
                    <p className={`text-sm font-medium ${text} mb-2`}>Modelo da ficha</p>
                    {formulario.modelo_url ? (
                      <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          <a href={formulario.modelo_url} target="_blank" rel="noopener noreferrer"
                            className={`text-sm ${text} truncate hover:underline`}>
                            {formulario.modelo_nome || 'Ver modelo carregado'}
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white">
                            <Plus className="w-3.5 h-3.5" /> Substituir
                            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                              onChange={e => {
                                const f = e.target.files && e.target.files[0];
                                if (f) uploadModelo(f);
                                e.target.value = '';
                              }} />
                          </label>
                          <button onClick={removerModelo} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-xs ${subtext}`}>Nenhum modelo carregado. Carregue a ficha de inscrição da instituição.</p>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white">
                          <Plus className="w-3.5 h-3.5" /> Carregar Ficha
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => {
                              const f = e.target.files && e.target.files[0];
                              if (f) uploadModelo(f);
                              e.target.value = '';
                            }} />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {formulario.modo === 'online' && (
                  <div className={`p-4 rounded-xl border ${card}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-medium ${text}`}>Campos da ficha preenchida no site</p>
                      <button onClick={adicionarCampo}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium">
                        <Plus className="w-3.5 h-3.5" /> Adicionar Campo
                      </button>
                    </div>
                    {(formulario.campos || []).length === 0 && (
                      <p className={`text-xs ${subtext}`}>Sem campos definidos. A ficha é considerada preenchida no site sem campos adicionais.</p>
                    )}
                    <div className="space-y-3">
                      {(formulario.campos || []).map((campo, idx) => (
                        <div key={campo.chave || idx} className={`p-3 rounded-xl border ${card} space-y-2`}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="md:col-span-1">
                              <label className={`block text-xs font-medium ${subtext} mb-1`}>Pergunta *</label>
                              <input type="text" value={campo.label}
                                onChange={e => atualizarCampo(idx, 'label', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${input} outline-none text-sm`}
                                placeholder="Ex: Nome do pai / encarregado" required />
                            </div>
                            <div>
                              <label className={`block text-xs font-medium ${subtext} mb-1`}>Tipo</label>
                              <select value={campo.tipo}
                                onChange={e => atualizarCampo(idx, 'tipo', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${input} outline-none text-sm`}>
                                <option value="text">Texto</option>
                                <option value="textarea">Texto longo</option>
                                <option value="date">Data</option>
                                <option value="select">Lista de opções</option>
                              </select>
                            </div>
                            <div className="flex items-end gap-2">
                              <label className={`flex items-center gap-2 text-xs ${text} pb-2`}>
                                <input type="checkbox" checked={!!campo.obrigatorio}
                                  onChange={e => atualizarCampo(idx, 'obrigatorio', e.target.checked)}
                                  className="w-4 h-4" />
                                Obrigatório
                              </label>
                              <button onClick={() => removerCampo(idx)}
                                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 pb-2">
                                <Trash2 className="w-3.5 h-3.5" /> Remover
                              </button>
                            </div>
                          </div>
                          {campo.tipo === 'select' && (
                            <div>
                              <label className={`block text-xs font-medium ${subtext} mb-1`}>Opções (uma por linha)</label>
                              <textarea value={(campo.opcoes || []).join('\n')}
                                onChange={e => atualizarCampo(idx, 'opcoes', e.target.value.split('\n').filter(o => o.trim()))}
                                className={`w-full px-3 py-2 rounded-lg border ${input} outline-none text-sm`}
                                rows={2} placeholder={'Opção 1\nOpção 2'} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(!configInscricao || !configInscricao.ciclos || configInscricao.ciclos.length === 0) && (
              <div className={`${card} border rounded-2xl p-12 text-center`}>
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className={`${text} font-medium`}>Sem configuração ainda</p>
                <p className={`${subtext} text-sm mt-1`}>Use "Gerar com Assistente" para criar automaticamente os requisitos por ciclo de ensino, ou edite e guarde.</p>
              </div>
            )}

            <CiclosEditor ciclos={configInscricao?.ciclos || []} setCiclos={(ciclos) => setConfigInscricao(prev => ({ ...(prev || {}), ciclos, estado: prev?.estado || 'rascunho' }))} />
          </>
        )}

        {aba === 'matricula' && (
          <>
            <div className={`p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 flex items-start gap-3`}>
              <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${text}`}>
                Estes requisitos aparecem ao encarregado <strong>depois da vaga ser aceite</strong>, no passo "Iniciar Matrícula".
                Ao concluir a matrícula, o sistema valida automaticamente que todos os obrigatórios foram confirmados.
              </p>
            </div>

            {(!configMatricula || !configMatricula.ciclos || configMatricula.ciclos.length === 0) && (
              <div className={`${card} border rounded-2xl p-12 text-center`}>
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className={`${text} font-medium`}>Sem requisitos de matrícula definidos</p>
                <p className={`${subtext} text-sm mt-1`}>Use "Gerar com Assistente" para criar automaticamente os requisitos de matrícula por ciclo de ensino.</p>
              </div>
            )}

            <CiclosEditor ciclos={configMatricula?.ciclos || []} setCiclos={(ciclos) => setConfigMatricula(prev => ({ ...(prev || {}), ciclos, estado: prev?.estado || 'rascunho' }))} />
          </>
        )}

        {aba === 'financeiro' && (
          <>
            <div className={`p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 flex items-start gap-3`}>
              <Wallet className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${text}`}>
                Valores que vigoram automaticamente no processo: o emolumento de inscrição é lançado quando o encarregado solicita a vaga;
                o de matrícula (e a 1ª mensalidade, se ativada) é exigido antes de concluir a matrícula; e as mensalidades do ano letivo são geradas automaticamente.
              </p>
            </div>

            <div className={`${card} border rounded-2xl overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700">
                <h2 className={`text-lg font-semibold ${text}`}>Emolumentos & Mensalidades</h2>
                <p className={`text-xs ${subtext}`}>Todos os valores em Kwanzas (Kz).</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoMoeda
                  label="Emolumento de Inscrição"
                  subtext={subtext} input={input}
                  valor={financas?.emolumento_inscricao?.valor || 0}
                  ativo={!!financas?.emolumento_inscricao?.ativo}
                  onChange={v => setFin('emolumento_inscricao', 'valor', v)}
                  onAtivo={v => setFin('emolumento_inscricao', 'ativo', v)}
                />
                <CampoMoeda
                  label="Emolumento de Matrícula"
                  subtext={subtext} input={input}
                  valor={financas?.emolumento_matricula?.valor || 0}
                  ativo={!!financas?.emolumento_matricula?.ativo}
                  onChange={v => setFin('emolumento_matricula', 'valor', v)}
                  onAtivo={v => setFin('emolumento_matricula', 'ativo', v)}
                />

                <div className={`p-4 rounded-xl border ${card}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className={`text-sm font-medium flex items-center gap-2`}>
                      <input type="checkbox" checked={!!financas?.mensalidade?.ativo}
                        onChange={e => setFin('mensalidade', 'ativo', e.target.checked)}
                        className="w-4 h-4" />
                      Mensalidade
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Valor (Kz)</label>
                      <input type="number" min="0" step="0.01"
                        value={financas?.mensalidade?.valor || 0}
                        onChange={e => setFin('mensalidade', 'valor', e.target.value)}
                        disabled={!financas?.mensalidade?.ativo}
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${financas?.mensalidade?.ativo ? '' : 'opacity-50 cursor-not-allowed'}`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Dia limite (1-28)</label>
                      <input type="number" min="1" max="28"
                        value={financas?.mensalidade?.dia_limite ?? 10}
                        onChange={e => setFin('mensalidade', 'dia_limite', e.target.value)}
                        disabled={!financas?.mensalidade?.ativo}
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${financas?.mensalidade?.ativo ? '' : 'opacity-50 cursor-not-allowed'}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={`block text-xs font-medium ${subtext} mb-1`}>Multa por atraso (Kz, por mês)</label>
                    <input type="number" min="0" step="0.01"
                      value={financas?.mensalidade?.multa_atraso || 0}
                      onChange={e => setFin('mensalidade', 'multa_atraso', e.target.value)}
                      disabled={!financas?.mensalidade?.ativo}
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${financas?.mensalidade?.ativo ? '' : 'opacity-50 cursor-not-allowed'}`} />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${card}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className={`text-sm font-medium flex items-center gap-2`}>
                      <input type="checkbox" checked={!!financas?.primeira_mensalidade}
                        onChange={e => setFinancas(prev => ({ ...prev, primeira_mensalidade: e.target.checked }))}
                        disabled={!financas?.mensalidade?.ativo}
                        className="w-4 h-4" />
                      Exigir 1ª mensalidade na matrícula
                    </label>
                  </div>
                  <p className={`text-xs ${subtext}`}>Se ativada, a primeira mensalidade é cobrada juntamente com o emolumento de matrícula antes da matrícula ser concluída.</p>
                </div>

                <div className={`p-4 rounded-xl border ${card} md:col-span-2`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className={`text-sm font-medium flex items-center gap-2`}>
                      <input type="checkbox" checked={!!financas?.comparticipacao?.ativo}
                        onChange={e => setFin('comparticipacao', 'ativo', e.target.checked)}
                        className="w-4 h-4" />
                      Comparticipação / Quota
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Valor (Kz)</label>
                      <input type="number" min="0" step="0.01"
                        value={financas?.comparticipacao?.valor || 0}
                        onChange={e => setFin('comparticipacao', 'valor', e.target.value)}
                        disabled={!financas?.comparticipacao?.ativo}
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${financas?.comparticipacao?.ativo ? '' : 'opacity-50 cursor-not-allowed'}`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${subtext} mb-1`}>Descrição</label>
                      <input type="text"
                        value={financas?.comparticipacao?.descricao || ''}
                        onChange={e => setFin('comparticipacao', 'descricao', e.target.value)}
                        disabled={!financas?.comparticipacao?.ativo}
                        placeholder="Ex: quota mensal da associação de pais"
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none ${financas?.comparticipacao?.ativo ? '' : 'opacity-50 cursor-not-allowed'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={salvarFinanceiro} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" /> Guardar Configuração Financeira
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequisitosInscricao;