import { Eye, Keyboard, Monitor, Volume2 } from 'lucide-react';

export default function Acessibilidade() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acessibilidade</h1>
          <p className="text-sm text-gray-500 mb-8">Compromisso com a acessibilidade digital</p>

          <div className="space-y-8">
            <section>
              <p className="text-gray-600 leading-relaxed mb-6">
                O SIME (Sistema Integrado de Monitorização Escolar) é comprometido em garantir a acessibilidade 
                digital para todas as pessoas, independentemente das suas capacidades ou tecnologias que utilizam. 
                Trabalhamos continuamente para melhorar a experiência de todos os utilizadores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Funcionalidades de Acessibilidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Modo Escuro</h3>
                    <p className="text-sm text-gray-600">Alterne entre temas claro e escuro para reduzir a fadiga visual.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Keyboard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Navegação por Teclado</h3>
                    <p className="text-sm text-gray-600">Navegue por todas as funcionalidades usando apenas o teclado.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Design Responsivo</h3>
                    <p className="text-sm text-gray-600">Adapta-se a qualquer tamanho de ecrã, desde telemóveis a monitores grandes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Contraste Adequado</h3>
                    <p className="text-sm text-gray-600">Cores com contraste suficiente para facilitar a leitura.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Atalhos de Teclado</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono font-medium text-gray-700 shadow-sm">Tab</kbd>
                    <span className="text-sm text-gray-600">Navegar entre elementos interactivos</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono font-medium text-gray-700 shadow-sm">Enter</kbd>
                    <span className="text-sm text-gray-600">Activar botões e ligações</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono font-medium text-gray-700 shadow-sm">Esc</kbd>
                    <span className="text-sm text-gray-600">Fechar modais e menus</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Compatibilidade</h2>
              <p className="text-gray-600 leading-relaxed">
                O SIME é optimizado para funcionar nos principais navegadores modernos, incluindo:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Google Chrome (versão 90+)</li>
                <li>Mozilla Firefox (versão 88+)</li>
                <li>Safari (versão 14+)</li>
                <li>Microsoft Edge (versão 90+)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Contactos e Suporte</h2>
              <p className="text-gray-600 leading-relaxed">
                Se encontrar alguma barreira de acessibilidade ou tiver sugestões para melhorar a experiência, 
                por favor entre em contacto connosco:
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-700"><strong>Email:</strong> acessibilidade@sime.ao</p>
                <p className="text-sm text-gray-700"><strong>Telefone:</strong> +244 923 000 000</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
