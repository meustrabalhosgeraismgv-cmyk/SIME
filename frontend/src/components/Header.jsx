import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Settings,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown
} from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/pesquisar-escolas?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    switch(type) {
      case 'sucesso': return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'aviso': return <AlertTriangle className="w-4 h-4 text-warning-500" />;
      case 'erro': return <AlertTriangle className="w-4 h-4 text-error-500" />;
      default: return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  const perfilLabels = {
    admin: 'Administrador do Sistema',
    instituicao: 'Gestor da Instituição',
    encarregado: 'Encarregado de Educação',
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-navy-700/50 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="Pesquisar escolas, alunos, professores..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-navy-900 rounded-2xl shadow-float border border-gray-100 dark:border-navy-700 overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-navy-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Marcar tudo como lido
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sem notificações</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-navy-800 ${
                        !notif.read ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{notif.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.username}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{perfilLabels[user?.perfil] || user?.perfil}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-navy-900 rounded-2xl shadow-float border border-gray-100 dark:border-navy-700 overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-gray-100 dark:border-navy-700">
                <p className="font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{perfilLabels[user?.perfil] || user?.perfil}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { navigate('/app/gerir-perfil'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Terminar Sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
