import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, ArrowRight, MapPin, ArrowLeft, Mail, KeyRound, Send, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { authService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Recuperação de senha
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState('email'); // email -> codigo -> senha

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const notificarErro = (msg) => {
    setError(msg);
    showToast({ message: msg, type: 'error' });
  };

  const notificarSucesso = (msg) => {
    setSuccess(msg);
    showToast({ message: msg, type: 'success' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/app/dashboard');
    } else {
      notificarErro(result.error);
    }

    setLoading(false);
  };

  const enviarCodigoRecuperacao = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authService.esqueciSenha({ email });
      notificarSucesso(res.data?.message || 'Código enviado para o seu email.');
      setEtapaRecuperacao('codigo');
    } catch (err) {
      notificarErro(err.response?.data?.error || 'Erro ao enviar o código. Verifique o email.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.verificarCodigo({ email, codigo, tipo: 'senha' });
      setResetToken(res.data.reset_token);
      setSuccess('');
      setEtapaRecuperacao('senha');
    } catch (err) {
      notificarErro(err.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const redefinirSenha = async (e) => {
    e.preventDefault();
    setError('');
    if (novaSenha !== confirmarSenha) {
      notificarErro('As palavras-passe não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await authService.redefinirSenha({ reset_token: resetToken, nova_senha: novaSenha });
      notificarSucesso('Palavra-passe redefinida com sucesso. Pode iniciar sessão.');
      setEtapaRecuperacao('email');
      setMode('login');
      setEmail('');
      setCodigo('');
      setNovaSenha('');
      setConfirmarSenha('');
      setResetToken('');
      setPassword('');
    } catch (err) {
      notificarErro(err.response?.data?.error || 'Erro ao redefinir a palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  const resetRecuperacao = () => {
    setMode('login');
    setError('');
    setSuccess('');
    setEtapaRecuperacao('email');
    setEmail('');
    setCodigo('');
    setNovaSenha('');
    setConfirmarSenha('');
    setResetToken('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden sime-gradient">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
            <circle cx="400" cy="300" r="200" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="400" cy="300" r="300" stroke="white" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="400" cy="300" r="400" stroke="white" strokeWidth="0.5" opacity="0.1"/>
            <path d="M100 500 Q250 400 400 450 T700 350" stroke="white" strokeWidth="1" opacity="0.2"/>
            <path d="M0 300 Q200 200 400 250 T800 150" stroke="white" strokeWidth="1" opacity="0.15"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="mb-6">
              <img src="/Logotipo.png" alt="SIME" className="h-16 w-auto" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-3">
              Educa Mais+ Angola
            </h1>
            <p className="text-xl text-white/90 font-light">
              Sistema Integrado de Monitorização Escolar
            </p>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">República de Angola</h3>
                <p className="text-white/70 text-sm">Toda a informação escolar num só lugar</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dados Seguros</h3>
                <p className="text-white/70 text-sm">Informação protegida e encriptada</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Acesso Fácil</h3>
                <p className="text-white/70 text-sm">Consulte escolas, vagas e matrículas online</p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Educa Mais+ Angola — Governo de Angola
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-navy-950">
        <div className="w-full max-w-md">
          {/* Back to site */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="large" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'login' ? 'Boas-vindas' : 'Recuperar palavra-passe'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {mode === 'login'
                ? 'Introduza as suas credenciais para aceder ao sistema'
                : 'Vamos ajudá-lo a repor o acesso à sua conta'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-500/10 border border-error-500/20 rounded-xl flex items-center gap-3">
              <div className="p-1.5 bg-error-500/10 rounded-lg">
                <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-success-50 dark:bg-success-500/10 border border-success-500/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
              <p className="text-sm font-medium text-success-600 dark:text-success-400">{success}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome de Utilizador
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Ex: venancio"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Palavra-passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { setMode('recuperar'); setError(''); setSuccess(''); }}
                  className="text-sm text-[#0061a4] font-semibold hover:underline"
                >
                  Esqueceu a palavra-passe?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base font-semibold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={
              etapaRecuperacao === 'email' ? enviarCodigoRecuperacao :
              etapaRecuperacao === 'codigo' ? confirmarCodigo :
              redefinirSenha
            } className="space-y-5">
              {etapaRecuperacao === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email da conta
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="email@exemplo.com"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base font-semibold">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                      <>
                        Enviar código
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </>
              )}

              {etapaRecuperacao === 'codigo' && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Enviámos um código de 6 dígitos para <strong>{email}</strong>. Introduza-o abaixo.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Código de verificação
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        className="input-field pl-10 tracking-widest text-center font-bold"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base font-semibold">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmar código'}
                  </button>
                </>
              )}

              {etapaRecuperacao === 'senha' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nova palavra-passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="input-field pr-12"
                        placeholder="Mínimo 6 caracteres"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar nova palavra-passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="input-field"
                      placeholder="Repita a nova palavra-passe"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base font-semibold">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Redefinir palavra-passe'}
                  </button>
                </>
              )}

              <button type="button" onClick={resetRecuperacao} className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-[#0061a4] font-medium">
                Voltar ao login
              </button>
            </form>
          )}

          {mode === 'login' && (
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-[#0061a4] font-semibold hover:underline">
                Criar conta
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;