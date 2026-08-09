import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, Siren } from 'lucide-react';
import { LogoImage } from './Logo';

const navLinks = [
  { to: '/', label: 'Página Inicial' },
  { to: '/escolas', label: 'Escolas' },
  { to: '/noticias', label: 'Notícias' },
  { to: '/calendario', label: 'Calendário' },
  { to: '/sos', label: 'SOS' },
];

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'text-[#2196F3] bg-blue-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Inter',sans-serif]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <LogoImage size="small" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/cadastro"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0061a4] rounded-lg border border-[#0061a4] hover:bg-[#0061a4]/5 transition-colors">
                <UserPlus className="w-4 h-4" />
                Cadastre-se
              </Link>
              <Link to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors bg-[#0061a4] hover:bg-[#00497d]">
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `block px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-[#2196F3]' : 'text-gray-600 hover:bg-gray-50'
                }`}>{l.label}</NavLink>
            ))}
            <Link to="/cadastro" onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-[#0061a4] text-center border border-[#0061a4] hover:bg-[#0061a4]/5">
              Cadastre-se
            </Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-white text-center mt-2 bg-[#0061a4]">
              Entrar
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            {/* Sobre */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LogoImage size="small" />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sistema Integrado de Monitorização Escolar da província do Huambo. 
                Aceda a informações sobre instituições de ensino, vagas e calendário lectivo.
              </p>
            </div>

            {/* Institucional */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Institucional</h4>
              <nav className="flex flex-col gap-3">
                <a href="https://huambo.gov.ao/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
                  <img src="/logos/governo-huambo.png" alt="GPH" className="w-8 h-8 rounded bg-white p-0.5" />
                  <div>
                    <p className="font-medium group-hover:text-white">Governo Provincial do Huambo</p>
                    <p className="text-xs text-gray-500">huambo.gov.ao</p>
                  </div>
                </a>
                <a href="https://med.gov.ao/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
                  <img src="/logos/med.png" alt="MED" className="w-8 h-8 rounded bg-white p-0.5" />
                  <div>
                    <p className="font-medium group-hover:text-white">Ministério da Educação</p>
                    <p className="text-xs text-gray-500">med.gov.ao</p>
                  </div>
                </a>
              </nav>
            </div>

            {/* Suporte */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Suporte</h4>
              <nav className="flex flex-col gap-3">
                <Link to="/acessibilidade" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Acessibilidade
                </Link>
                <Link to="/termos-de-uso" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </nav>
            </div>

            {/* Contactos SIME */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contactos</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Huambo, Angola</p>
                <a href="mailto:info@sime.ao" className="block hover:text-white transition-colors">info@sime.ao</a>
                <a href="tel:+244923000000" className="block hover:text-white transition-colors">+244 923 000 000</a>
              </div>
            </div>

            {/* Desenvolvedor */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Desenvolvedor</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <a href="mailto:andiotechinovacoes@gmail.com" className="block hover:text-white transition-colors">
                  andiotechinovacoes@gmail.com
                </a>
                <a href="tel:+244928565837" className="block hover:text-white transition-colors">
                  +244 928 565 837
                </a>
                <a href="tel:+244936125131" className="block hover:text-white transition-colors">
                  +244 936 125 131
                </a>
                <a href="https://andiotechinovacoes.netlify.app/" target="_blank" rel="noopener noreferrer"
                  className="block hover:text-white transition-colors">
                  andiotechinovacoes.netlify.app
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SIME Huambo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://huambo.gov.ao/" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors" title="Governo Provincial do Huambo">
                <img src="/logos/governo-huambo.png" alt="GPH" className="w-6 h-6 rounded bg-white p-0.5 opacity-50 hover:opacity-100" />
              </a>
              <a href="https://med.gov.ao/" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors" title="Ministério da Educação">
                <img src="/logos/med.png" alt="MED" className="w-6 h-6 rounded bg-white p-0.5 opacity-50 hover:opacity-100" />
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-4 pt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-gray-600">Desenvolvido por</span>
            <a href="https://andiotechinovacoes.netlify.app/" target="_blank" rel="noopener noreferrer">
              <img src="/logos/AndioTech.png" alt="AnDioTech Inovações" className="h-6 hover:opacity-80 transition-opacity" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
