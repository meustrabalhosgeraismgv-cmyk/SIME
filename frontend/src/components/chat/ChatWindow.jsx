import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Mic, Square, Loader, ArrowLeft, Users, Settings } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { getSocket, joinConversa, leaveConversa, sendMessage, emitTyping, emitStopTyping, markRead, onNewMessage, onUserTyping, onUserStopTyping } from '../../services/socketClient';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ conversaId, user, onBack, onOpenSettings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversa, setConversa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!conversaId) return;
    setLoading(true);
    setMessages([]);

    const loadData = async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          chatService.getConversa(conversaId),
          chatService.getMensagens(conversaId),
        ]);
        setConversa(convRes.data);
        setMessages(msgRes.data.data || []);
        joinConversa(conversaId);
        markRead(conversaId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => { leaveConversa(conversaId); };
  }, [conversaId]);

  useEffect(() => {
    const unsubMsg = onNewMessage((msg) => {
      const cid = (msg.conversa_id?.toString?.() || msg.conversa_id);
      const currentId = (conversaId?.toString?.() || conversaId);
      if (cid === currentId) {
        setMessages(prev => {
          const key = msg.id || msg._id;
          return prev.some(x => (x.id || x._id) === key) ? prev : [...prev, msg];
        });
        markRead(conversaId);
      }
      if (window.__chatNewMessage) window.__chatNewMessage(msg);
    });

    const unsubTyping = onUserTyping(({ userId, conversaId: cid }) => {
      if (cid === conversaId && userId !== user?.id) {
        setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
        setTimeout(() => setTypingUsers(prev => prev.filter(id => id !== userId)), 3000);
      }
    });

    const unsubStop = onUserStopTyping(({ userId, conversaId: cid }) => {
      if (cid === conversaId) setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    return () => { unsubMsg(); unsubTyping(); unsubStop(); };
  }, [conversaId, user?.id]);

  useEffect(() => {
    if (!conversaId) return;
    let interval = null;
    const sincronizar = () => {
      const s = getSocket();
      if (!s?.connected) {
        chatService.getMensagens(conversaId)
          .then(res => setMessages(res.data.data || []))
          .catch(() => {});
      }
    };
    interval = setInterval(sincronizar, 5000);
    return () => clearInterval(interval);
  }, [conversaId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const addMessage = (m) => {
    if (!m) return;
    const key = m.id || m._id;
    setMessages(prev => prev.some(x => (x.id || x._id) === key) ? prev : [...prev, m]);
    if (window.__chatNewMessage) window.__chatNewMessage(m);
  };

  const enviar = async ({ conteudo, tipo = 'texto', ficheiro_url = null }) => {
    setSending(true);
    try {
      const resp = await sendMessage({ conversaId, conteudo, tipo, ficheiro_url });
      addMessage(resp?.data || resp);
    } catch (err) {
      try {
        const res = await chatService.enviarMensagem(conversaId, { conteudo, tipo, ficheiro_url });
        addMessage(res.data);
      } catch (e2) {
        console.error('Erro ao enviar mensagem:', e2);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    await enviar({ conteudo: text });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversaId) return;
    setEnviandoAnexo(true);
    try {
      const res = await chatService.uploadFicheiro(file);
      const isImagem = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const conteudo = isImagem ? (file.name || 'Imagem') : (isAudio ? (file.name || 'Áudio') : (file.name || 'Ficheiro'));
      await enviar({
        conteudo,
        tipo: isImagem ? 'imagem' : isAudio ? 'audio' : 'ficheiro',
        ficheiro_url: res.data.url
      });
    } catch (err) {
      console.error('Erro ao enviar ficheiro:', err);
    } finally {
      setEnviandoAnexo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    if (!conversaId) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      console.error('Áudio não suportado neste browser');
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        setRecording(false);
        await handleAudioBlob(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      console.error('Erro ao gravar áudio:', err);
      setRecording(false);
      alert('Não foi possível aceder ao microfone. Verifica as permissões do browser e tenta novamente.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      setRecording(false);
    }
  };

  const handleAudioBlob = async (blob) => {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `audio_${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' });
    setEnviandoAnexo(true);
    try {
      const res = await chatService.uploadFicheiro(file);
      await enviar({ conteudo: 'Mensagem de áudio', tipo: 'audio', ficheiro_url: res.data.url });
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
    } finally {
      setEnviandoAnexo(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(conversaId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitStopTyping(conversaId), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherParticipant = () => {
    return conversa?.participantes?.find(p => p.id !== user?.id);
  };

  const other = getOtherParticipant();
  const title = conversa?.tipo === 'grupo' ? conversa?.nome : (other?.nome || other?.username || 'Conversa');
  const subtitle = conversa?.tipo === 'grupo'
    ? `${conversa?.participantes?.length} membros`
    : (other?.perfil === 'admin' ? 'Administrador' : other?.perfil === 'instituicao' ? 'Instituição' : 'Encarregado');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">A carregar mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-900">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
          conversa?.tipo === 'grupo' ? 'bg-primary-500' : 'bg-gray-400 dark:bg-navy-600'
        }`}>
          {conversa?.tipo === 'grupo' ? <Users className="w-4 h-4" /> : title.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {conversa?.tipo === 'grupo' && user?.perfil !== 'encarregado' && (
          <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800">
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-navy-950">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircleIcon />
            <p className="text-sm mt-2">Inicie a conversa</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || msg._id}
              message={msg}
              isOwn={String(msg.remetente_id) === String(user?.id)}
              showSender={conversa?.tipo === 'grupo' && idx === 0 || (idx > 0 && messages[idx - 1].remetente_id !== msg.remetente_id)}
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">A digitar...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-900">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={enviandoAnexo || recording}
          title="Enviar ficheiro"
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {enviandoAnexo ? <Loader className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
        </button>
        {recording ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">A gravar...</span>
            <button
              type="button"
              onClick={stopRecording}
              title="Parar gravação"
              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={enviandoAnexo || sending}
            title="Gravar mensagem de áudio"
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors disabled:opacity-50"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={recording}
          placeholder="Escreva uma mensagem..."
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || recording}
          className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function MessageCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-navy-600">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
