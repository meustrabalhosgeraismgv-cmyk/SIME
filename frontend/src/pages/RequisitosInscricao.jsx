import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FileText, Loader2, Save, CheckCircle, Sparkles, Plus, Trash2, Building2, Bell } from 'lucide-react';
import { requisitoInscricaoService, instituicaoService } from '../services/api';

const CICLOS_META = {
  primario: { nome: 'Ensino Primário', descricao: '1ª a 6ª classe' },
  secundario: { nome: 'I Ciclo do Ensino Secundário', descricao: '7ª a 9ª classe' },
  medio: { nome: 'Ensino Médio (II Ciclo)', descricao: '10ª a 13ª classe' },
};

const RequisitosInscricao = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoId, setInstituicaoId] = useState('');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const isAdmin = user?.perfil === 'admin';
  const eInstituicao = user?.perfil === 'instituicao';

  const loadConfig = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await requisitoInscricaoService.getMinha(id);
      setConfig(res.data?.data || null);
    } catch (e) {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eInstituicao) {
      setInstituicaoId(user?.entidade_id || '');
      loadConfig(user?.entidade_id);
    } else if (isAdmin) {
      instituicaoService.getAll({ limit: 100 })
        .then(r => setInstituicoes(r.data.data || []))
        .catch(() => setInstituicoes([]));
    }
  }, [eInstituicao, isAdmin, user, loadConfig]);

  useEffect(() => {
    if (isAdmin && instituicaoId) loadConfig(instituicaoId);
  }, [isAdmin, instituicaoId, loadConfig]);

  const gerarComAssistente = async () => {
    if (!instituicaoId) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    setGerando(true);
    setAlertMsg(null);
    try {
      const res = await requisitoInscricaoService.gerarComAssistente(instituicaoId, Object.keys(CICLOS_META));
      const gerado = res.data?.data;
      setConfig(prev => ({ ...(prev || {}), instituicao_id: gerado.instituicao_id, ciclos: gerado.ciclos, estado: 'rascunho' }));
      setAlertMsg({ type: 'success', message: gerado.mensagem || 'Requisitos gerados pelo assistente. Reveja e guarde.' });
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao gerar requisitos' });
    } finally {
      setGerando(false);
    }
  };

  const atualizarRequisito = (cicloIdx, reqIdx, campo, valor) => {
    setConfig(prev => {
      if (!prev) return prev;
      const ciclos = [...prev.ciclos];
      const requisitos = [...(ciclos[cicloIdx].requisitos || [])];
      requisitos[reqIdx] = { ...requisitos[reqIdx], [campo]: valor };
      ciclos[cicloIdx] = { ...ciclos[cicloIdx], requisitos };
      return { ...prev, ciclos };
    });
  };

  const adicionarRequisito = (cicloIdx) => {
    setConfig(prev => {
      if (!prev) return prev;
      const ciclos = [...prev.ciclos];
      ciclos[cicloIdx] = { ...ciclos[cicloIdx], requisitos: [...(ciclos[cicloIdx].requisitos || []), { chave: `doc_${Date.now()}`, nome: '', descricao: '', obrigatorio: true, aceita_pdf: true }] };
      return { ...prev, ciclos };
    });
  };

  const removerRequisito = (cicloIdx, reqIdx) => {
    setConfig(prev => {
      if (!prev) return prev;
      const ciclos = [...prev.ciclos];
      ciclos[cicloIdx] = { ...ciclos[cicloIdx], requisitos: (ciclos[cicloIdx].requisitos || []).filter((_, i) => i !== reqIdx) };
      return { ...prev, ciclos };
    });
  };

  const guardar = async (aprovar = false) => {
    if (!instituicaoId) { setAlertMsg({ type: 'error', message: 'Selecione a instituição' }); return; }
    if (!config || !config.ciclos || config.ciclos.length === 0) {
      setAlertMsg({ type: 'error', message: 'Sem ciclos para guardar. Gere com o assistente ou edite antes.' });
      return;
    }
    setSaving(true);
    setAlertMsg(null);
    try {
      const payload = { ciclos: config.ciclos, estado: aprovar ? 'aprovada' : 'rascunho', formulario: config.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] } };
      if (aprovar) {
        await requisitoInscricaoService.salvar(instituicaoId, payload);
        const res = await requisitoInscricaoService.aprovar(instituicaoId);
        setAlertMsg({ type: 'success', message: res.data?.message || 'Configuração aprovada e comunicado publicado em todo o sistema' });
      } else {
        await requisitoInscricaoService.salvar(instituicaoId, payload);
        setAlertMsg({ type: 'success', message: 'Configuração guardada como rascunho. Aprove para publicar o comunicado.' });
      }
      loadConfig(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao guardar configuração' });
    } finally {
      setSaving(false);
    }
  };

  const atualizarFormulario = (campo, valor) => {
    setConfig(prev => {
      if (!prev) return prev;
      const formulario = { ...(prev.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] }), [campo]: valor };
      return { ...prev, formulario };
    });
  };

  const adicionarCampo = () => {
    const formulario = config?.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };
    atualizarFormulario('campos', [...(formulario.campos || []), { chave: `campo_${Date.now()}`, label: '', tipo: 'text', opcoes: [], obrigatorio: true }]);
  };

  const atualizarCampo = (idx, campo, valor) => {
    const formulario = config?.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };
    const campos = [...(formulario.campos || [])];
    campos[idx] = { ...campos[idx], [campo]: valor };
    atualizarFormulario('campos', campos);
  };

  const removerCampo = (idx) => {
    const formulario = config?.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };
    atualizarFormulario('campos', (formulario.campos || []).filter((_, i) => i !== idx));
  };

  const uploadModelo = async (file) => {
    if (!instituicaoId || !file) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      await requisitoInscricaoService.uploadModelo(instituicaoId, file);
      setAlertMsg({ type: 'success', message: 'Modelo da ficha carregado. Os encarregados farão download e devolverão preenchido.' });
      loadConfig(instituicaoId);
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
      loadConfig(instituicaoId);
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao remover o modelo' });
    } finally {
      setSaving(false);
    }
  };

  const formulario = config?.formulario || { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };

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

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Requisitos de Inscrição</h1>
              <p className={`text-sm ${subtext}`}>Documentos e condições de admissão, inscrição e matrícula da instituição</p>
            </div>
          </div>
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

        {config && config.estado && (
          <div className={`p-4 rounded-xl border ${
            config.estado === 'aprovada' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : config.estado === 'padrao' ? 'bg-gray-50 border-gray-200 dark:bg-navy-800 dark:border-navy-700'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          }`}>
            <p className={`text-sm font-medium ${text}`}>
              Estado: <span className="capitalize font-bold">{config.estado === 'padrao' ? 'Requisitos padrão do sistema' : config.estado}</span>
            </p>
            {config.estado === 'aprovada' && config.aprovado_em && (
              <p className={`text-xs ${subtext}`}>Aprovado em {new Date(config.aprovado_em).toLocaleDateString('pt-AO')} — comunicado publicado para todo o sistema.</p>
            )}
            {config.estado !== 'aprovada' && (
              <p className={`text-xs ${subtext}`}>Após aprovar, o sistema cria automaticamente um comunicado visível para toda a comunidade.</p>
            )}
          </div>
        )}

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
                {formulario.modelo_url && (
                  <p className={`text-xs ${subtext} mt-2`}>Ao aprovar, o encarregado verá o botão "Descarregar Ficha" e terá de anexar a ficha preenchida na solicitação de vaga.</p>
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
                  <p className={`text-xs ${subtext}`}>Sem campos definidos. A ficha é considerada preenchida no site sem campos adicionais. Adicione campos para recolher mais informações.</p>
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

        {(!config || !config.ciclos || config.ciclos.length === 0) && (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className={`${text} font-medium`}>Sem configuração ainda</p>
            <p className={`${subtext} text-sm mt-1`}>Use "Gerar com Assistente" para criar automaticamente os requisitos por ciclo de ensino, ou edite e guarde.</p>
          </div>
        )}

        {config?.ciclos?.map((ciclo, cicloIdx) => {
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
      </div>
    </div>
  );
};

export default RequisitosInscricao;