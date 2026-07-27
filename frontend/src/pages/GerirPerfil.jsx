import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Settings, Save, Loader2, User, Lock, Camera, X,
  School, Users, GraduationCap, BookOpen, ClipboardList,
  Mail, Phone, Building2, TrendingUp, AlertCircle
} from 'lucide-react';
import { authService } from '../services/api';

const GerirPerfil = () => {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', username: '',
    nova_senha: '', confirmar_senha: ''
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      setLoading(true);
      const response = await authService.getPerfilCompleto();
      const data = response.data;
      setPerfilCompleto(data);
      setForm({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        username: data.username || '',
        nova_senha: '',
        confirmar_senha: ''
      });
      if (data.foto) {
        setPreviewFoto(data.foto);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'A imagem deve ter menos de 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewFoto(reader.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const response = await authService.uploadFoto(file);
      const novaFoto = response.data.foto;
      setPreviewFoto(novaFoto);
      setPerfilCompleto(prev => ({ ...prev, foto: novaFoto }));
      const userData = JSON.parse(localStorage.getItem('sime_user') || '{}');
      userData.foto = novaFoto;
      localStorage.setItem('sime_user', JSON.stringify(userData));
      setUser({ ...user, foto: novaFoto });
      setAlert({ type: 'success', message: 'Foto atualizada com sucesso!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao fazer upload da foto' });
      setPreviewFoto(perfilCompleto?.foto || null);
    } finally {
      setUploading(false);
    }
  };

  const removeFoto = () => {
    setPreviewFoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.nova_senha && form.nova_senha !== form.confirmar_senha) {
      setAlert({ type: 'error', message: 'As senhas não coincidem' });
      return;
    }
    setSaving(true);
    try {
      const payload = { nome: form.nome, email: form.email, telefone: form.telefone };
      if (form.nova_senha) payload.nova_senha = form.nova_senha;
      await authService.updatePerfil(payload);
      const userData = JSON.parse(localStorage.getItem('sime_user') || '{}');
      userData.nome = form.nome;
      localStorage.setItem('sime_user', JSON.stringify(userData));
      setUser({ ...user, nome: form.nome });
      setAlert({ type: 'success', message: 'Perfil actualizado com sucesso!' });
      setForm({ ...form, nova_senha: '', confirmar_senha: '' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao guardar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const getPerfilLabel = () => {
    const labels = {
      admin: 'Administrador do Sistema',
      instituicao: user?.is_gestor ? 'Gestor da Instituição' : 'Instituição',
      encarregado: 'Encarregado de Educação'
    };
    return labels[user?.perfil] || user?.perfil;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-[#0061a4]" />
    </div>
  );

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white placeholder-gray-400 focus:border-[#0061a4]'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0061a4]';

  const dados = perfilCompleto?.dados_vinculados || {};

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#0061a4]/10 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#0061a4]" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Gerir Perfil</h1>
            <p className={`text-sm ${subtext}`}>Actualize os seus dados pessoais</p>
          </div>
        </div>

        {alert && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            alert.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className={`w-5 h-5 ${alert.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
            <p className={`text-sm font-medium ${alert.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alert.message}</p>
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Foto e Dados */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Perfil com Foto */}
            <div className={`${card} border rounded-2xl p-6`}>
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 dark:bg-navy-700 flex items-center justify-center border-4 border-white dark:border-navy-600 shadow-lg">
                    {previewFoto ? (
                      <img src={previewFoto} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#0061a4] rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#00497d] transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </label>
                  {previewFoto && (
                    <button
                      onClick={removeFoto}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold ${text}`}>{form.nome || user?.username}</h2>
                  <p className={`text-sm ${subtext} mt-1`}>{getPerfilLabel()}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5" /> {form.email || 'Sem email'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5" /> {form.telefone || 'Sem telefone'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário Dados Pessoais */}
            <form onSubmit={handleSave}>
              <div className={`${card} border rounded-2xl p-6 mb-6`}>
                <h2 className={`text-lg font-semibold ${text} mb-4`}>Dados Pessoais</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Nome Completo</label>
                    <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-[#0061a4]/20 outline-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${subtext} mb-1`}>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-[#0061a4]/20 outline-none`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${subtext} mb-1`}>Telefone</label>
                      <input type="text" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})}
                        className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-[#0061a4]/20 outline-none`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Nome de Utilizador</label>
                    <input type="text" value={form.username} disabled
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} opacity-60 cursor-not-allowed`} />
                  </div>
                </div>
              </div>

              <div className={`${card} border rounded-2xl p-6 mb-6`}>
                <h2 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                  <Lock className="w-5 h-5 text-[#0061a4]" /> Alterar Senha
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Nova Senha</label>
                    <input type="password" value={form.nova_senha} onChange={e => setForm({...form, nova_senha: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-[#0061a4]/20 outline-none`}
                      placeholder="Deixe vazio para não alterar" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${subtext} mb-1`}>Confirmar Senha</label>
                    <input type="password" value={form.confirmar_senha} onChange={e => setForm({...form, confirmar_senha: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border ${input} focus:ring-2 focus:ring-[#0061a4]/20 outline-none`}
                      placeholder="Repita a nova senha" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0061a4] hover:bg-[#00497d] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Coluna Direita - Dados Vinculados */}
          <div className="space-y-6">
            {/* Admin - Estatísticas Gerais */}
            {user?.perfil === 'admin' && (
              <>
                <div className={`${card} border rounded-2xl p-5`}>
                  <h3 className={`text-sm font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <TrendingUp className="w-4 h-4 text-[#0061a4]" /> Visão Geral do Sistema
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0061a4]">{dados.total_instituicoes || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Instituições</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{dados.total_alunos || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Alunos</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-amber-600">{dados.total_professores || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Professores</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-purple-600">{dados.total_turmas || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Turmas</p>
                    </div>
                  </div>
                </div>
                <div className={`${card} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${subtext}`}>Vagas Totais</span>
                    <span className={`font-bold ${text}`}>{dados.total_vagas || 0}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${subtext}`}>Vagas Disponíveis</span>
                    <span className="font-bold text-green-600">{dados.vagas_disponiveis || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${subtext}`}>Utilizadores</span>
                    <span className={`font-bold ${text}`}>{dados.total_usuarios || 0}</span>
                  </div>
                </div>
              </>
            )}

            {/* Instituição - Dados Vinculados */}
            {user?.perfil === 'instituicao' && (
              <>
                <div className={`${card} border rounded-2xl p-5`}>
                  <h3 className={`text-sm font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <Building2 className="w-4 h-4 text-[#0061a4]" /> Minha Instituição
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0061a4]">{dados.professores?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Professores</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{dados.alunos?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Alunos</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-purple-600">{dados.turmas?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Turmas</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-amber-600">{dados.vagas_disponiveis || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Vagas Livres</p>
                    </div>
                  </div>
                </div>

                {dados.solicitacoes_pendentes > 0 && (
                  <div className={`${card} border rounded-2xl p-5 border-l-4 border-l-amber-500`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className={`font-semibold ${text}`}>{dados.solicitacoes_pendentes}</p>
                        <p className="text-xs text-gray-500">Solicitações Pendentes</p>
                      </div>
                    </div>
                  </div>
                )}

                {dados.professores?.length > 0 && (
                  <div className={`${card} border rounded-2xl p-5`}>
                    <h3 className={`text-sm font-semibold ${text} mb-3 flex items-center gap-2`}>
                      <GraduationCap className="w-4 h-4 text-[#0061a4]" /> Professores
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dados.professores.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                          <div>
                            <p className={`text-sm font-medium ${text}`}>{p.nome_completo}</p>
                            <p className="text-xs text-gray-500">{p.especialidade || 'Sem especialidade'}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            p.estado === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{p.estado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Encarregado - Alunos e Solicitações */}
            {user?.perfil === 'encarregado' && (
              <>
                <div className={`${card} border rounded-2xl p-5`}>
                  <h3 className={`text-sm font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <Users className="w-4 h-4 text-[#0061a4]" /> Os Meus Alunos
                  </h3>
                  {dados.alunos?.length > 0 ? (
                    <div className="space-y-2">
                      {dados.alunos.map(a => (
                        <div key={a.id} className="p-3 bg-gray-50 dark:bg-navy-700 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-semibold ${text}`}>{a.nome_completo}</p>
                              <p className="text-xs text-gray-500">{a.numero_estudante}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              a.estado === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>{a.estado}</span>
                          </div>
                          <p className="text-xs text-[#0061a4] mt-1 flex items-center gap-1">
                            <School className="w-3 h-3" /> {a.instituicao_nome || 'Sem instituição'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno registado</p>
                  )}
                </div>

                {dados.solicitacoes?.length > 0 && (
                  <div className={`${card} border rounded-2xl p-5`}>
                    <h3 className={`text-sm font-semibold ${text} mb-3 flex items-center gap-2`}>
                      <ClipboardList className="w-4 h-4 text-[#0061a4]" /> Últimas Solicitações
                    </h3>
                    <div className="space-y-2">
                      {dados.solicitacoes.map(s => (
                        <div key={s.id} className="p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${text}`}>{s.aluno_nome}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              s.estado === 'pendente' ? 'bg-amber-100 text-amber-700' :
                              s.estado === 'aceite' ? 'bg-green-100 text-green-700' :
                              s.estado === 'inscrito' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>{s.estado}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{s.instituicao_nome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerirPerfil;
