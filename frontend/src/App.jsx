import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Public layout and pages
import PublicLayout from './components/PublicLayout';
import PublicEscolas from './pages/public/PublicEscolas';
import PublicDetalheEscola from './pages/public/PublicDetalheEscola';
import NoticiasPage from './pages/public/NoticiasPage';
import CalendarioPage from './pages/public/CalendarioPage';
import PublicDashboard from './pages/public/PublicDashboard';
import TermosDeUso from './pages/public/TermosDeUso';
import Acessibilidade from './pages/public/Acessibilidade';
import Sospage from './pages/public/Sospage';

// Auth
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';

// Protected layout and pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PesquisarEscolas from './pages/PesquisarEscolas';
import Instituicoes from './pages/Instituicoes';
import DetalhesInstituicao from './pages/DetalhesInstituicao';
import Alunos from './pages/Alunos';
import Professores from './pages/Professores';
import Turmas from './pages/Turmas';
import Matriculas from './pages/Matriculas';
import Encarregados from './pages/Encarregados';
import Estatisticas from './pages/Estatisticas';
import Relatorios from './pages/Relatorios';
import GerirInstituicao from './pages/GerirInstituicao';
import GerirVagas from './pages/GerirVagas';
import SolicitacoesGestor from './pages/SolicitacoesGestor';
import ComunicadosGestor from './pages/ComunicadosGestor';
import GerirPerfil from './pages/GerirPerfil';
import Aprovacoes from './pages/Aprovacoes';
import Utilizadores from './pages/Utilizadores';
import Solicitacoes from './pages/Solicitacoes';
import Chat from './pages/Chat';
import FicheirosEscolares from './pages/FicheirosEscolares';
import Sms from './pages/Sms';
import RecursosHumanos from './pages/RecursosHumanos';
import Denuncias from './pages/Denuncias';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">A carregar...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<PublicDashboard />} />
        <Route path="escolas" element={<PublicEscolas />} />
        <Route path="escolas/:id" element={<PublicDetalheEscola />} />
        <Route path="noticias" element={<NoticiasPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="termos-de-uso" element={<TermosDeUso />} />
        <Route path="acessibilidade" element={<Acessibilidade />} />
        <Route path="sos" element={<Sospage />} />
      </Route>

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      
      {/* PROTECTED ROUTES */}
      <Route path="/app" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pesquisar-escolas" element={<PesquisarEscolas />} />
        <Route path="instituicoes" element={<Instituicoes />} />
        <Route path="instituicoes/:id" element={<DetalhesInstituicao />} />
        <Route path="alunos" element={<Alunos />} />
        <Route path="professores" element={<Professores />} />
        <Route path="turmas" element={<Turmas />} />
        <Route path="matriculas" element={<Matriculas />} />
        <Route path="encarregados" element={<Encarregados />} />
        <Route path="estatisticas" element={<Estatisticas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="gerir-instituicao" element={<GerirInstituicao />} />
        <Route path="gerir-vagas" element={<GerirVagas />} />
        <Route path="solicitacoes-gestor" element={<SolicitacoesGestor />} />
        <Route path="comunicados" element={<ComunicadosGestor />} />
        <Route path="noticias-instituicao" element={<NoticiasPage />} />
        <Route path="noticias" element={<NoticiasPage />} />
        <Route path="aprovacoes" element={<Aprovacoes />} />
        <Route path="utilizadores" element={<Utilizadores />} />
        <Route path="solicitacoes" element={<Solicitacoes />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:conversaId" element={<Chat />} />
        <Route path="gerir-perfil" element={<GerirPerfil />} />
        <Route path="ficheiros-escolares" element={<FicheirosEscolares />} />
        <Route path="sms" element={<Sms />} />
        <Route path="recursos-humanos" element={<RecursosHumanos />} />
        <Route path="denuncias" element={<Denuncias />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
