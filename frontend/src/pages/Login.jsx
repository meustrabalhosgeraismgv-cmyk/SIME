import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, ArrowRight, MapPin, ArrowLeft } from 'lucide-react';
import { LogoImage } from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/app/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
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
              © 2026 Educa Mais+ Angola — Governo de Angola
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-navy-950">
        <div className="w-full max-w-md">
          {/* Back to site */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mb-4">
              <LogoImage size="large" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Boas-vindas
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Introduza as suas credenciais para aceder ao sistema
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
                placeholder="Ex: admin"
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

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-[#0061a4] font-semibold hover:underline">
              Criar conta
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-navy-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Acesso rápido de teste
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { user: 'admin', label: 'Administrador', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
                { user: 'escola.huambo', label: 'Instituição', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { user: 'encarregado1', label: 'Encarregado', color: 'bg-success-50 text-success-600 hover:bg-success-500/10' },
              ].map((item) => (
                <button
                  key={item.user}
                  type="button"
                  onClick={() => quickLogin(item.user, '123456')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${item.color}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
