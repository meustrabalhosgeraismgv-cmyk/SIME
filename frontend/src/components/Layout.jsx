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
        <main className="p-6 min-h-[calc(100vh-7rem)]">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Layout;
