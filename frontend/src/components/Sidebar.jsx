import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogoImageIcon } from './Logo';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  Search,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Bell,
  CheckCircle,
  MessageCircle,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useTheme();
  const location = useLocation();

  const adminMenu = [
    {
      title: 'Gestão do Sistema',
      items: [
        { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
        { icon: School, label: 'Instituições', path: '/app/instituicoes' },
        { icon: Newspaper, label: 'Notícias Gerais', path: '/app/noticias' },
        { icon: CheckCircle, label: 'Aprovar Instituições', path: '/app/aprovacoes' },
        { icon: Users, label: 'Utilizadores', path: '/app/utilizadores' },
      ]
    },
    {
      title: 'Análise',
      items: [
        { icon: BarChart3, label: 'Estatísticas', path: '/app/estatisticas' },
        { icon: FileText, label: 'Relatórios', path: '/app/relatorios' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
      ]
    },
    {
      title: 'Conta',
      items: [
        { icon: Settings, label: 'Gerir Perfil', path: '/app/gerir-perfil' },
      ]
    }
  ];

  const instituicaoMenu = [
    {
      title: 'Gestão da Instituição',
      items: [
        { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
        { icon: School, label: 'Gerir Instituição', path: '/app/gerir-instituicao' },
        { icon: BookOpen, label: 'Gerir Turmas', path: '/app/turmas' },
        { icon: Users, label: 'Gerir Alunos', path: '/app/alunos' },
        { icon: GraduationCap, label: 'Gerir Professores', path: '/app/professores' },
        { icon: ClipboardList, label: 'Matrículas', path: '/app/matriculas' },
      ]
    },
    {
      title: 'Vagas & Solicitações',
      items: [
        { icon: BarChart3, label: 'Gerir Vagas', path: '/app/gerir-vagas' },
        { icon: CheckCircle, label: 'Aceitar Solicitações', path: '/app/solicitacoes-gestor' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { icon: Newspaper, label: 'Gerir Notícias', path: '/app/noticias-instituicao' },
        { icon: Bell, label: 'Comunicados', path: '/app/comunicados' },
        { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
        { icon: Settings, label: 'Gerir Perfil', path: '/app/gerir-perfil' },
      ]
    }
  ];

  const encarregadoMenu = [
    {
      title: 'Minha Conta',
      items: [
        { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
        { icon: Search, label: 'Pesquisar Escolas', path: '/app/pesquisar-escolas' },
        { icon: ClipboardList, label: 'As Minhas Solicitações', path: '/app/solicitacoes' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { icon: Settings, label: 'Gerir Perfil', path: '/app/gerir-perfil' },
      ]
    }
  ];

  let menuItems;
  if (user?.perfil === 'admin') {
    menuItems = adminMenu;
  } else if (user?.perfil === 'instituicao') {
    menuItems = instituicaoMenu;
  } else {
    menuItems = encarregadoMenu;
  }

  const perfilLabels = {
    admin: 'Administrador do Sistema',
    instituicao: user?.is_gestor ? 'Gestor da Instituição' : 'Instituição',
    encarregado: 'Encarregado de Educação',
  };

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out ${
      sidebarCollapsed ? 'w-[72px]' : 'w-64'
    } bg-primary-900 dark:bg-navy-950 flex flex-col`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/10 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        {sidebarCollapsed ? (
          <LogoImageIcon size={36} />
        ) : (
          <img src="/Logotipo.png" alt="SIME" className="h-10 w-auto object-contain animate-fade-in" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!sidebarCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive: active }) => 
                    `sidebar-link group relative ${
                      active || location.pathname === item.path ? 'active' : ''
                    } ${sidebarCollapsed ? 'justify-center px-0 py-3' : ''}`
                  }
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    location.pathname === item.path ? 'text-white' : 'text-white/60 group-hover:text-white'
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {location.pathname === item.path && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full" />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={`border-t border-white/10 p-3 ${sidebarCollapsed ? 'px-2' : ''}`}>
        {!sidebarCollapsed ? (
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center">
                {user?.foto ? (
                  <img src={user.foto} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.nome || user?.username}</p>
                <p className="text-white/50 text-xs truncate">{perfilLabels[user?.perfil] || user?.perfil}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Sair"
            className="w-full flex items-center justify-center p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-50"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
