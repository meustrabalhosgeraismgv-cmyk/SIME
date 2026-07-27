import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do SIME. Como posso ajudá-lo hoje?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const faqResponses = {
    'matricula': 'Para efectuar uma matrícula, aceda à secção "Matrículas" no menu lateral. Será necessário seleccionar a escola, turma e fornecer os dados do aluno e do encarregado de educação.',
    'vagas': 'Para consultar vagas disponíveis, aceda a "Pesquisar Escolas" e filtre por município ou tipo de ensino. Cada escola mostra o estado das vagas com indicadores de cor: verde (disponível), laranja (poucas vagas) ou vermelho (lotada).',
    'escola': 'Para encontrar uma escola, use a barra de pesquisa ou o mapa interactivo. Pode pesquisar por nome, município, tipo de ensino ou código da escola.',
    'notas': 'Os encarregados de educação podem consultar as notas dos seus filhos no Painel do Encarregado. Os professores lançam notas na secção "Turmas".',
    'horario': 'Os horários são disponibilizados pelas escolas. Consulte a página da escola para ver os horários das turmas.',
    'calendario': 'O calendário escolar é definido pelo Ministério da Educação. As datas importantes como início e fim das aulas, exames e férias estão disponíveis na secção "Calendário".',
    'contactos': 'Para contactar uma escola, aceda à página da instituição e encontre os dados de contacto (telefone, email, endereço).',
    'registo': 'Para se registar no sistema, contacte a administração da sua escola ou a Direcção Municipal de Educação.',
    'help': 'Posso ajudá-lo com: pesquisar escolas, consultar vagas, informações sobre matrículas, calendário escolar, notas e muito mais!',
  };

  const getResponse = (msg) => {
    const lower = msg.toLowerCase();
    for (const [key, response] of Object.entries(faqResponses)) {
      if (lower.includes(key)) return response;
    }
    return 'Obrigado pela sua mensagem. Para informações mais detalhadas, consulte as secções do sistema ou contacte a administração. Posso ajudá-lo com informações sobre escolas, vagas, matrículas e calendário escolar.';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(input);
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  const quickActions = [
    'Como consultar vagas?',
    'Como fazer matrícula?',
    'Encontrar escola',
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-float flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800 dark:bg-navy-700 rotate-0' 
            : 'bg-primary-500 hover:bg-primary-600 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-white dark:bg-navy-900 rounded-2xl shadow-float border border-gray-100 dark:border-navy-700 overflow-hidden animate-slide-up flex flex-col">
          {/* Header */}
          <div className="sime-gradient px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                Assistente SIME
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </h3>
              <p className="text-xs text-white/70">Sempre disponível para ajudar</p>
            </div>
            <div className="w-2.5 h-2.5 bg-success-400 rounded-full animate-pulse"></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-navy-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-gray-200 dark:bg-navy-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="bg-gray-100 dark:bg-navy-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => { setInput(action); }}
                  className="px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-navy-700">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva a sua mensagem..."
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
