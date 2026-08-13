import { Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import TopNav from './TopNav';
import ChatWidget from './ChatWidget';

const Layout = () => {
  const { sidebarCollapsed } = useTheme();
  
  return (
    <div className="min-h-screen bg-surface dark:bg-navy-950 transition-colors duration-300">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-64'}`}>
        <Header />
        <TopNav />
        <main className="p-6 min-h-[calc(100vh-8rem)]">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-gray-200 dark:border-navy-800 py-3 px-6 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-600">Desenvolvido por</span>
          <a href="https://andiotechinovacoes.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors">
            AnDioTech Inovações
          </a>
        </footer>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Layout;
