import { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, Check } from 'lucide-react';
import { chatService } from '../../services/chatService';

export default function NewConversationModal({ isOpen, onClose, onCreate, user }) {
  const [tab, setTab] = useState('private');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const canCreateGroup = user?.perfil === 'admin' || user?.perfil === 'instituicao';

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    chatService.getUtilizadores()
      .then(res => setUsers(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = users.filter(u => {
    const name = (u.nome || u.username || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const toggleSelect = (userId) => {
    setSelected(prev =>
      tab === 'private'
        ? [userId]
        : prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    try {
      if (tab === 'private') {
        await onCreate({ tipo: 'privada', participantes: selected });
      } else {
        if (!groupName.trim()) return;
        await onCreate({ tipo: 'grupo', nome: groupName, descricao: groupDesc, participantes: selected });
      }
      setSelected([]);
      setGroupName('');
      setGroupDesc('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Nova Conversa</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {canCreateGroup && (
          <div className="flex border-b border-gray-100 dark:border-navy-700">
            <button
              onClick={() => { setTab('private'); setSelected([]); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'private' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" />
              Privada
            </button>
            <button
              onClick={() => { setTab('group'); setSelected([]); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'group' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              Grupo
            </button>
          </div>
        )}

        {tab === 'group' && (
          <div className="px-5 pt-4 space-y-3">
            <input
              type="text"
              placeholder="Nome do grupo *"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        )}

        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar utilizadores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-4">A carregar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Nenhum utilizador encontrado</p>
          ) : (
            filtered.map(u => (
              <button
                key={u.id}
                onClick={() => toggleSelect(u.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  selected.includes(u.id)
                    ? 'bg-primary-50 dark:bg-primary-500/10'
                    : 'hover:bg-gray-50 dark:hover:bg-navy-800/50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-navy-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {(u.nome || u.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nome || u.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.perfil === 'admin' ? 'Administrador' : u.perfil === 'instituicao' ? 'Instituição' : 'Encarregado'}</p>
                </div>
                {selected.includes(u.id) && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-navy-700">
          <button
            onClick={handleCreate}
            disabled={selected.length === 0 || creating || (tab === 'group' && !groupName.trim())}
            className="w-full py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {creating ? 'A criar...' : selected.length === 0 ? 'Selecione utilizadores' : `Criar ${tab === 'grupo' ? 'Grupo' : 'Conversa'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
