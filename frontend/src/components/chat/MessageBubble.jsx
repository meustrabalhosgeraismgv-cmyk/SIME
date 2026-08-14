import { useState } from 'react';
import { FileText, Image as ImageIcon, Music, File, Download, Eye, EyeOff } from 'lucide-react';
import { chatService } from '../../services/chatService';
import WaveformPlayer from './WaveformPlayer';

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({ message, isOwn, url }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const name = message.conteudo || message.ficheiro_nome || 'Ficheiro';
  const tipo = (message.ficheiro_tipo || '').toLowerCase();
  const size = formatSize(message.ficheiro_tamanho);
  const isPdf = tipo.includes('pdf') || name.toLowerCase().endsWith('.pdf');

  let Icon = File;
  if (isPdf) Icon = FileText;
  else if (tipo.startsWith('image/')) Icon = ImageIcon;
  else if (tipo.startsWith('audio/')) Icon = Music;

  const textMuted = isOwn ? 'text-white/75' : 'text-gray-400 dark:text-gray-500';
  const hoverIcon = isOwn ? 'hover:text-white hover:bg-white/20' : 'hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-navy-700';

  return (
    <div className="min-w-[220px] max-w-[270px]">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-white/20' : 'bg-gray-100 dark:bg-navy-700'}`}>
          <Icon className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-primary-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate max-w-[150px]">{name}</p>
          <div className={`flex items-center gap-2 text-[11px] ${textMuted}`}>
            {size && <span>{size}</span>}
            {isPdf && <span className="uppercase font-medium">PDF</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {isPdf && (
            <button
              onClick={() => setPreviewOpen(p => !p)}
              title={previewOpen ? 'Fechar pré-visualização' : 'Ver pré-visualização'}
              className={`p-1.5 rounded-lg transition-colors ${textMuted} ${hoverIcon}`}
            >
              {previewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            title="Transferir ficheiro"
            className={`p-1.5 rounded-lg transition-colors ${textMuted} ${hoverIcon}`}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
      {isPdf && previewOpen && (
        <iframe
          src={url}
          title={name}
          className="mt-2 w-full h-44 rounded-lg bg-white border border-gray-200 dark:border-navy-600"
        />
      )}
    </div>
  );
}

function ImageCard({ message, isOwn, url }) {
  return (
    <div className="min-w-[180px] max-w-[240px]">
      <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir imagem">
        <img src={url} alt={message.conteudo || 'Imagem'} className="max-w-full rounded-lg" />
      </a>
      {message.conteudo && message.conteudo !== 'Imagem' && (
        <p className={`mt-1 text-[11px] truncate ${isOwn ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'}`}>
          {message.conteudo}
        </p>
      )}
    </div>
  );
}

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

  const conteudoRender = () => {
    const url = chatService.urlFicheiro(message.ficheiro_url);
    if (message.ficheiro_url && (message.tipo === 'audio' || (message.ficheiro_tipo || '').startsWith('audio/'))) {
      return <WaveformPlayer url={url} isOwn={isOwn} />;
    }
    if (message.ficheiro_url && (message.tipo === 'imagem' || (message.ficheiro_tipo || '').startsWith('image/'))) {
      return <ImageCard message={message} isOwn={isOwn} url={url} />;
    }
    if (message.ficheiro_url) {
      return <FileCard message={message} isOwn={isOwn} url={url} />;
    }
    return message.conteudo;
  };

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
          {conteudoRender()}
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
