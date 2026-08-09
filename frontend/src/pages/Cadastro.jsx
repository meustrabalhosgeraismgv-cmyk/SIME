import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Building2, Shield, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { LogoImage } from '../components/Logo';

const PERFIS = [
  { value: 'instituicao', label: 'Instituição de Ensino', desc: 'Registar a minha instituição e gerir vagas, alunos, professores e comunicados', icon: Building2 },
  { value: 'encarregado', label: 'Encarregado de Educação', desc: 'Consultar escolas, vagas e solicitar matrículas para o meu filho', icon: Users },
];

const Cadastro = () => {
  const [perfil, setPerfil] = useState(null);
  const [escolasExistentes, setEscolasExistentes] = useState([]);
  const [escolaExiste, setEscolaExiste] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    username: '',
    password: '',
    confirmPassword: '',
    instituicao_nome: '',
    instituicao_municipio: '',
    instituicao_tipo: 'ensino_primario',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (perfil === 'instituicao') {
      const fetchEscolas = async () => {
        try {
          const api = (await import('../services/api')).default;
          const res = await api.get('/instituicoes?limit=100');
          setEscolasExistentes(res.data?.data || []);
        } catch (err) {
          console.error('Erro ao buscar escolas:', err);
        }
      };
      fetchEscolas();
    }
  }, [perfil]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As palavras-passe não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const api = (await import('../services/api')).default;
      const payload = {
        username: formData.username,
        password: formData.password,
        perfil,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
      };

      if (perfil === 'instituicao') {
        payload.instituicao_nome = formData.instituicao_nome;
        payload.instituicao_municipio = formData.instituicao_municipio;
        payload.instituicao_tipo = formData.instituicao_tipo;
      }

      await api.post('/auth/register', payload);

      if (perfil === 'instituicao') {
        if (escolaExiste && formData.instituicao_nome) {
          setSuccess('Solicitação de reivindicação enviada! Aguarde aprovação do administrador do sistema.');
        } else {
          setSuccess('Conta criada com sucesso! Aguarde aprovação do administrador do sistema.');
        }
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const { login } = await import('../contexts/AuthContext');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0061a4]">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
            <circle cx="400" cy="300" r="200" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="400" cy="300" r="300" stroke="white" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="400" cy="300" r="400" stroke="white" strokeWidth="0.5" opacity="0.1"/>
            <path d="M100 500 Q250 400 400 450 T700 350" stroke="white" strokeWidth="1" opacity="0.2"/>
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="mb-6">
              <img src="/Logotipo.png" alt="SIME" className="h-16 w-auto" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-3">
              Criar Conta
            </h1>
            <p className="text-xl text-white/90 font-light">
              Junte-se à plataforma educacional de Angola
            </p>
          </div>
          
          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Para Instituições</h3>
                <p className="text-white/70 text-sm">Registe a sua escola, gere vagas, alunos e comunicados</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Para Encarregados</h3>
                <p className="text-white/70 text-sm">Encontre escolas e solicite vagas para os seus filhos</p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-white/60 text-sm">
              © 2026 Educa Mais+ Angola — Governo de Angola
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0061a4] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>

          <div className="lg:hidden text-center mb-8">
            <LogoImage size="large" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Criar nova conta
            </h2>
            <p className="text-gray-500 mt-2">
              Escolha o seu perfil e preencha os dados
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-medium text-green-600">{success}</p>
            </div>
          )}

          {/* Step 1: Profile Selection */}
          {perfil === null && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Que perfil deseja?</p>
              {PERFIS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPerfil(p.value)}
                  className="w-full p-5 rounded-xl border-2 text-left transition-all border-gray-200 hover:border-[#0061a4]/50 hover:bg-gray-50 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0061a4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <p.icon className="w-5 h-5 text-[#0061a4]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.label}</p>
                    <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
                  </div>
                </button>
              ))}
              
              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  O registo de instituições requer aprovação do administrador do sistema
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {perfil !== null && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setPerfil(null)} className="text-sm text-[#0061a4] hover:underline">
                  ← Trocar perfil
                </button>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">{PERFIS.find(p => p.value === perfil)?.label}</span>
              </div>

              {perfil === 'instituicao' && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      O primeiro utilizador registado torna-se o <strong>Gestor</strong> da instituição.
                    </p>
                  </div>

                  {/* Toggle: escola existe ou nova */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEscolaExiste(true)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                        escolaExiste
                          ? 'bg-[#0061a4] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      A minha escola já existe
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscolaExiste(false)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                        !escolaExiste
                          ? 'bg-[#0061a4] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Solicitar nova escola
                    </button>
                  </div>

                  {escolaExiste ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Selecionar a sua instituição *</label>
                        <select
                          name="instituicao_nome"
                          value={formData.instituicao_nome}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                          required
                        >
                          <option value="">Selecionar instituição...</option>
                          {escolasExistentes.map((e) => (
                            <option key={e.id} value={e.nome}>
                              {e.nome} — {e.municipio_nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.instituicao_nome && (
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs text-indigo-700">
                            <strong>Reivindicar escola:</strong> Será vinculado como Gestor desta instituição após aprovação do administrador.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-700">
                          A escola será adicionada pelo administrador do sistema após a sua solicitação.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Instituição *</label>
                        <input
                          type="text"
                          name="instituicao_nome"
                          value={formData.instituicao_nome}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                          placeholder="Ex: Liceu Nacional Comandante Bula"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Ensino</label>
                        <select
                          name="instituicao_tipo"
                          value={formData.instituicao_tipo}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                        >
                          <option value="pre_escolar">Ensino Pré-Escolar</option>
                          <option value="ensino_primario">Ensino Primário</option>
                          <option value="ensino_medio">Ensino Médio</option>
                          <option value="ensino_superior">Ensino Superior</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Município</label>
                        <select
                          name="instituicao_municipio"
                          value={formData.instituicao_municipio}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                        >
                          <option value="">Selecionar município</option>
                          <option value="Huambo">Huambo</option>
                          <option value="Caála">Caála</option>
                          <option value="Bailundo">Bailundo</option>
                          <option value="Ekunha">Ekunha</option>
                          <option value="Longonjo">Longonjo</option>
                          <option value="Londuimbali">Londuimbali</option>
                          <option value="Mungo">Mungo</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome completo *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                  placeholder={perfil === 'instituicao' ? 'Nome do gestor da instituição' : 'Nome do encarregado'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                  placeholder="+244 9XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome de utilizador *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                  placeholder="Ex: joao.silva"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Palavra-passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar palavra-passe *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0061a4]/20 focus:border-[#0061a4] transition-all"
                  placeholder="Repita a palavra-passe"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0061a4] hover:bg-[#00497d] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {perfil === 'instituicao' && escolaExiste && formData.instituicao_nome
                      ? 'Reivindicar Escola'
                      : 'Criar Conta'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#0061a4] font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
