import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, School, Users, GraduationCap, BookOpen, ClipboardList,
  Search, Settings, BarChart3, FileText, Newspaper, Bell, CheckCircle,
  MessageCircle, Wallet, ListChecks,
} from 'lucide-react';

const menuConfigs = {
  admin: [
    { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
    { icon: School, label: 'Instituições', path: '/app/instituicoes' },
    { icon: Newspaper, label: 'Notícias', path: '/app/noticias' },
    { icon: CheckCircle, label: 'Aprovar', path: '/app/aprovacoes' },
    { icon: Users, label: 'Utilizadores', path: '/app/utilizadores' },
    { icon: BarChart3, label: 'Estatísticas', path: '/app/estatisticas' },
    { icon: FileText, label: 'Relatórios', path: '/app/relatorios' },
    { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
    { icon: Settings, label: 'Perfil', path: '/app/gerir-perfil' },
  ],
  instituicao: [
    { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
    { icon: School, label: 'Instituição', path: '/app/gerir-instituicao' },
    { icon: BookOpen, label: 'Turmas', path: '/app/turmas' },
    { icon: Users, label: 'Alunos', path: '/app/alunos' },
    { icon: GraduationCap, label: 'Professores', path: '/app/professores' },
    { icon: ClipboardList, label: 'Matrículas', path: '/app/matriculas' },
    { icon: ListChecks, label: 'Ciclo de Vida', path: '/app/ciclo-vida' },
    { icon: BarChart3, label: 'Vagas', path: '/app/gerir-vagas' },
    { icon: CheckCircle, label: 'Solicitações', path: '/app/solicitacoes-gestor' },
    { icon: FileText, label: 'Requisitos de Inscrição', path: '/app/requisitos-inscricao' },
    { icon: Newspaper, label: 'Notícias', path: '/app/noticias-instituicao' },
    { icon: Bell, label: 'Comunicados', path: '/app/comunicados' },
    { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
    { icon: Settings, label: 'Perfil', path: '/app/gerir-perfil' },
  ],
  encarregado: [
    { icon: LayoutDashboard, label: 'Página Inicial', path: '/app/dashboard' },
    { icon: Search, label: 'Pesquisar', path: '/app/pesquisar-escolas' },
    { icon: ClipboardList, label: 'Solicitações', path: '/app/solicitacoes' },
    { icon: Wallet, label: 'Pagamentos', path: '/app/pagamentos' },
    { icon: MessageCircle, label: 'Mensagens', path: '/app/chat' },
    { icon: Settings, label: 'Perfil', path: '/app/gerir-perfil' },
  ],
};

export default function TopNav() {
  const { user } = useAuth();
  const location = useLocation();

  const items = menuConfigs[user?.perfil] || menuConfigs.encarregado;

  return (
    <div className="bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-navy-700 shadow-sm">
      <div className="px-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 min-w-max py-2.5">
          {items.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-800'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
