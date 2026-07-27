export default function MessageBubble({ message, isOwn, showSender }) {
  const isSistema = message.tipo === 'sistema';

  if (isSistema) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-white dark:bg-navy-900 px-3 py-1 rounded-full">
          {message.conteudo}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-navy-600 flex items-center justify-center text-[10px] font-bold text-white">
              {(message.remetente_nome || message.remetente_username || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {message.remetente_nome || message.remetente_username}
            </span>
            {message.remetente_perfil && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-500 dark:text-gray-400 uppercase font-medium">
                {message.remetente_perfil === 'admin' ? 'Admin' : message.remetente_perfil === 'instituicao' ? 'Inst' : 'Enc'}
              </span>
            )}
          </div>
        )}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-primary-500 text-white rounded-2xl rounded-br-md'
              : 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-navy-700'
          }`}
        >
          {message.tipo === 'imagem' && message.ficheiro_url ? (
            <img src={message.ficheiro_url} alt="Imagem" className="max-w-[240px] rounded-lg" />
          ) : (
            message.conteudo
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(message.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
