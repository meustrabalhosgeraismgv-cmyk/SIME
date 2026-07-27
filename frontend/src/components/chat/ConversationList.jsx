import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users, MessageCircle, Circle } from 'lucide-react';
import { chatService } from '../../services/chatService';

export default function ConversationList({ selectedId, onSelect, user }) {
  const [conversas, setConversas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversas = useCallback(async () => {
    try {
      const res = await chatService.getConversas();
      setConversas(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversas();
  }, [fetchConversas]);

  useEffect(() => {
    const handler = (msg) => {
      setConversas(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversa_id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ultima_mensagem: msg, nao_lidas: updated[idx].id === selectedId ? 0 : (updated[idx].nao_lidas || 0) + 1 };
          updated.sort((a, b) => {
            const ta = a.ultima_mensagem?.created_at || a.created_at;
            const tb = b.ultima_mensagem?.created_at || b.created_at;
            return new Date(tb) - new Date(ta);
          });
          return updated;
        }
        return prev;
      });
      fetchConversas();
    };
    window.__chatNewMessage = handler;
    return () => { delete window.__chatNewMessage; };
  }, [selectedId, fetchConversas]);

  const getConversaTitle = (c) => {
    if (c.tipo === 'grupo') return c.nome;
    const other = c.participantes?.find(p => p.id !== user?.id);
    return other?.nome || other?.username || 'Conversa';
  };

  const getConversaSubtitle = (c) => {
    if (c.tipo === 'grupo') {
      return c.participantes?.length + ' membros';
    }
    const other = c.participantes?.find(p => p.id !== user?.id);
    const perfis = { admin: 'Admin', instituicao: 'Instituição', encarregado: 'Encarregado' };
    return perfis[other?.perfil] || other?.perfil || '';
  };

  const getInitials = (c) => {
    if (c.tipo === 'grupo') return c.nome?.charAt(0)?.toUpperCase() || 'G';
    const other = c.participantes?.find(p => p.id !== user?.id);
    return (other?.nome || other?.username || '?').charAt(0).toUpperCase();
  };

  const filtered = conversas.filter(c => {
    const title = getConversaTitle(c).toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 dark:border-navy-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-400 text-sm">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400">
            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa</p>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); window.__chatNewMessage && (c.nao_lidas = 0); }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors border-b border-gray-50 dark:border-navy-800 ${
                selectedId === c.id ? 'bg-primary-50 dark:bg-primary-500/10 border-l-2 border-l-primary-500' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
                c.tipo === 'grupo' ? 'bg-primary-500' : 'bg-gray-400 dark:bg-navy-600'
              }`}>
                {c.tipo === 'grupo' ? <Users className="w-5 h-5" /> : getInitials(c)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{getConversaTitle(c)}</span>
                  {c.ultima_mensagem && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {new Date(c.ultima_mensagem.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{getConversaSubtitle(c)}</span>
                  {c.nao_lidas > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full px-1">
                      {c.nao_lidas}
                    </span>
                  )}
                </div>
                {c.ultima_mensagem && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {c.ultima_mensagem.tipo === 'sistema' ? c.ultima_mensagem.conteudo : `${c.ultima_mensagem.remetente_nome?.split(' ')[0]}: ${c.ultima_mensagem.conteudo}`}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
