export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualização: Julho 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                Ao aceder e utilizar o Sistema Integrado de Monitorização Escolar (SIME) da província do Huambo, 
                o utilizador concorda com os presentes Termos de Uso. Caso não concorde, deve abstenhar-se de utilizar 
                o sistema.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Objectivo do Sistema</h2>
              <p className="text-gray-600 leading-relaxed">
                O SIME destina-se a disponibilizar informações sobre instituições de ensino na província do Huambo, 
                incluindo dados sobre vagas, calendário lectivo, notícias e processo de inscrição. O sistema é 
                gerido pelo Governo Provincial do Huambo em cooperação com o Ministério da Educação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Contas de Utilizador</h2>
              <p className="text-gray-600 leading-relaxed">
                O registo no sistema implica a fornecimento de informações exactas e actualizadas. 
                Cada utilizador é responsável pela segurança da sua conta e palavra-passe. 
                É proibido partilhar credenciais de acesso com terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Uso Adequado</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>O sistema deve ser utilizado apenas para fins legais e em conformidade com a legislação angolana</li>
                <li>É proibido introduzir dados falsos ou enganosos</li>
                <li>Não é permitido tentar aceder a contas de outros utilizadores</li>
                <li>É vedado utilizar o sistema para fins comerciais não autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Propriedade Intelectual</h2>
              <p className="text-gray-600 leading-relaxed">
                Todo o conteúdo disponibilizado no SIME, incluindo textos, gráficos, logótipos e código-fonte, 
                é propriedade do Governo Provincial do Huambo ou dos seus parceiros, sendo protegido pelas leis 
                de propriedade intelectual de Angola.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Isenção de Responsabilidade</h2>
              <p className="text-gray-600 leading-relaxed">
                O SIME é fornecido "tal como está", sem garantias de qualquer natureza. 
                O Governo Provincial do Huambo não se responsabiliza por danos decorrentes da utilização 
                do sistema, incluindo, mas não se limitando a, perda de dados ou interrupções de serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Alterações aos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                O SIME reserva-se o direito de alterar estes Termos de Uso a qualquer momento, 
                sendo as alterações publicadas nesta página. A utilização continuada do sistema após 
                as alterações constitui aceitação das mesmas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contactos</h2>
              <p className="text-gray-600 leading-relaxed">
                Para questões relativas a estes Termos de Uso, entre em contacto com a equipa do SIME 
                através do email <span className="font-medium">info@sime.ao</span> ou visite os gabinetes 
                do Governo Provincial do Huambo.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
