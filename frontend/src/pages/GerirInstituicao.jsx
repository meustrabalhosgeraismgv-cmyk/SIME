import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { School, Save, MapPin, Upload, Loader2, Plus, Trash2, GraduationCap, BookOpen, Clock, FileText } from 'lucide-react';
import { cursoService, informacoesService } from '../services/api';

const GerirInstituicao = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [instituicao, setInstituicao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [cursos, setCursos] = useState([]);
  const [info, setInfo] = useState(null);
  const [novoCurso, setNovoCurso] = useState({ nome: '', grau: 'licenciatura', duracao: '', vagas_totais: 0, turno: 'diurno' });
  const [form, setForm] = useState({
    nome: '', endereco: '', telefone: '', email: '', responsavel: '',
    latitude: '', longitude: '', lema: '', descricao: '',
    taxa_inscricao: 0, taxa_matricula: 0, aceita_inscricao_online: 0, aceita_inscricao_presencial: 1,
    imagem_url: '', logotipo_url: ''
  });
  const [infoForm, setInfoForm] = useState({
    horario_atendimento: '08:00 - 15:00', dias_atendimento: 'Segunda a Sexta',
    documentos_necessarios: '', procedimentos_inscricao: '', taxa_reserva_rupe: '',
    telefone_secretaria: '', email_secretaria: '', endereco_secretaria: '',
    website: '', link_portal_estudante: '', notas_admissionais: ''
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [instRes, cursosRes, infoRes] = await Promise.all([
        fetch(`/api/instituicoes/${user?.entidade_id}`).then(r => r.json()),
        cursoService.getByInstituicao(user?.entidade_id).catch(() => ({ data: { data: [] } })),
        informacoesService.getByInstituicao(user?.entidade_id).catch(() => ({ data: null }))
      ]);
      setInstituicao(instRes);
      setForm({
        nome: instRes.nome || '', endereco: instRes.endereco || '', telefone: instRes.telefone || '',
        email: instRes.email || '', responsavel: instRes.responsavel || '',
        latitude: instRes.latitude || '', longitude: instRes.longitude || '',
        lema: instRes.lema || '', descricao: instRes.descricao || '',
        taxa_inscricao: instRes.taxa_inscricao || 0, taxa_matricula: instRes.taxa_matricula || 0,
        aceita_inscricao_online: instRes.aceita_inscricao_online || 0,
        aceita_inscricao_presencial: instRes.aceita_inscricao_presencial ?? 1,
        imagem_url: instRes.imagem_url || '', logotipo_url: instRes.logotipo_url || ''
      });
      setCursos(cursosRes.data.data || []);
      if (infoRes.data) {
        setInfo(infoRes.data);
        setInfoForm(infoRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveDados = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/instituicoes/${user?.entidade_id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      alert('Dados gerais guardados!');
    } catch (e) { alert('Erro ao guardar'); }
    finally { setSaving(false); }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await informacoesService.update(user?.entidade_id, infoForm);
      alert('Informações da instituição guardadas!');
    } catch (e) { alert('Erro ao guardar'); }
    finally { setSaving(false); }
  };

  const handleAddCurso = async () => {
    if (!novoCurso.nome.trim()) return;
    try {
      const res = await cursoService.create(user?.entidade_id, novoCurso);
      setCursos([...cursos, { ...novoCurso, id: res.data.id, estado: 'ativo', vagas_disponiveis: novoCurso.vagas_totais }]);
      setNovoCurso({ nome: '', grau: 'licenciatura', duracao: '', vagas_totais: 0, turno: 'diurno' });
    } catch (e) { alert('Erro ao adicionar curso'); }
  };

  const handleDeleteCurso = async (id) => {
    if (!confirm('Remover este curso?')) return;
    try {
      await cursoService.delete(id);
      setCursos(cursos.filter(c => c.id !== id));
    } catch (e) { alert('Erro ao remover'); }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white placeholder-gray-400 focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500';

  const tabs = [
    { id: 'dados', label: 'Dados Gerais', icon: School },
    { id: 'cursos', label: 'Cursos', icon: GraduationCap },
    { id: 'info', label: 'Informações', icon: FileText },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <School className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Gerir Instituição</h1>
            <p className={`text-sm ${subtext}`}>{instituicao?.nome}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${card} border rounded-2xl mb-6 overflow-hidden`}>
          <div className="flex border-b border-gray-200 dark:border-navy-700">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5'
                    : `${subtext} hover:bg-gray-50 dark:hover:bg-navy-700`
                }`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Dados Gerais */}
        {activeTab === 'dados' && (
          <form onSubmit={handleSaveDados}>
            <div className={`${card} border rounded-2xl p-6 mb-6`}>
              <h2 className={`text-lg font-semibold ${text} mb-4`}>Dados Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Nome *</label>
                  <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} required />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Responsável</label>
                  <input type="text" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Endereço</label>
                  <input type="text" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Descrição</label>
                  <textarea rows={3} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none resize-none`} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar
              </button>
            </div>
          </form>
        )}

        {/* Tab: Cursos */}
        {activeTab === 'cursos' && (
          <div>
            <div className={`${card} border rounded-2xl p-6 mb-6`}>
              <h2 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                <Plus className="w-5 h-5 text-primary-500" /> Adicionar Curso
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <input type="text" value={novoCurso.nome} onChange={e => setNovoCurso({...novoCurso, nome: e.target.value})} placeholder="Nome do curso" className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <select value={novoCurso.grau} onChange={e => setNovoCurso({...novoCurso, grau: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}>
                    <option value="tecnico">Técnico</option>
                    <option value="licenciatura">Licenciatura</option>
                    <option value="mestrado">Mestrado</option>
                    <option value="doutorado">Doutorado</option>
                  </select>
                </div>
                <div>
                  <input type="text" value={novoCurso.duracao} onChange={e => setNovoCurso({...novoCurso, duracao: e.target.value})} placeholder="Duração" className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div className="flex gap-2">
                  <input type="number" value={novoCurso.vagas_totais} onChange={e => setNovoCurso({...novoCurso, vagas_totais: parseInt(e.target.value) || 0})} placeholder="Vagas" className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                  <button onClick={handleAddCurso} className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium flex items-center gap-1 flex-shrink-0">
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              </div>
            </div>

            <div className={`${card} border rounded-2xl overflow-hidden`}>
              <div className="p-4 border-b border-gray-200 dark:border-navy-700">
                <h3 className={`font-semibold ${text} flex items-center gap-2`}>
                  <GraduationCap className="w-5 h-5 text-primary-500" /> Cursos ({cursos.length})
                </h3>
              </div>
              {cursos.length === 0 ? (
                <div className="p-8 text-center"><p className={subtext}>Nenhum curso registado</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 dark:bg-navy-700">
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Curso</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Grau</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Duração</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Vagas</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Ações</th>
                    </tr></thead>
                    <tbody>
                      {cursos.map(c => (
                        <tr key={c.id} className="border-t border-gray-100 dark:border-navy-700">
                          <td className="px-4 py-3 font-medium">{c.nome}</td>
                          <td className="px-4 py-3 capitalize">{c.grau}</td>
                          <td className="px-4 py-3">{c.duracao || '-'}</td>
                          <td className="px-4 py-3 text-center">{c.vagas_disponiveis}/{c.vagas_totais}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleDeleteCurso(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Informações */}
        {activeTab === 'info' && (
          <div>
            <div className={`${card} border rounded-2xl p-6 mb-6`}>
              <h2 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                <Clock className="w-5 h-5 text-primary-500" /> Atendimento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Horário</label>
                  <input type="text" value={infoForm.horario_atendimento} onChange={e => setInfoForm({...infoForm, horario_atendimento: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="08:00 - 15:00" />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Dias</label>
                  <input type="text" value={infoForm.dias_atendimento} onChange={e => setInfoForm({...infoForm, dias_atendimento: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Telefone Secretaria</label>
                  <input type="text" value={infoForm.telefone_secretaria} onChange={e => setInfoForm({...infoForm, telefone_secretaria: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Email Secretaria</label>
                  <input type="email" value={infoForm.email_secretaria} onChange={e => setInfoForm({...infoForm, email_secretaria: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Endereço Secretaria</label>
                  <input type="text" value={infoForm.endereco_secretaria} onChange={e => setInfoForm({...infoForm, endereco_secretaria: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Website</label>
                  <input type="url" value={infoForm.website} onChange={e => setInfoForm({...infoForm, website: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="https://..." />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Portal do Estudante</label>
                  <input type="url" value={infoForm.link_portal_estudante} onChange={e => setInfoForm({...infoForm, link_portal_estudante: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className={`${card} border rounded-2xl p-6 mb-6`}>
              <h2 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                <FileText className="w-5 h-5 text-orange-500" /> Documentos e Procedimentos
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Documentos Necessários (separados por vírgula)</label>
                  <textarea rows={3} value={infoForm.documentos_necessarios} onChange={e => setInfoForm({...infoForm, documentos_necessarios: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none resize-none`} placeholder="Bilhete de Identidade, Certificado, Fotografias..." />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Procedimentos de Inscrição</label>
                  <textarea rows={4} value={infoForm.procedimentos_inscricao} onChange={e => setInfoForm({...infoForm, procedimentos_inscricao: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none resize-none`} placeholder="Descreva os procedimentos de inscrição..." />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Notas Admissionais</label>
                  <textarea rows={2} value={infoForm.notas_admissionais} onChange={e => setInfoForm({...infoForm, notas_admissionais: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none resize-none`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${subtext} mb-1`}>Dados RUPE (Pagamento)</label>
                  <input type="text" value={infoForm.taxa_reserva_rupe} onChange={e => setInfoForm({...infoForm, taxa_reserva_rupe: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`} placeholder="Nº RUPE, Entidade, Referência..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveInfo} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Informações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerirInstituicao;
