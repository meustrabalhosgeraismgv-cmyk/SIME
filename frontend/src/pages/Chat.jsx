import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import NewConversationModal from '../components/chat/NewConversationModal';
import GroupSettingsModal from '../components/chat/GroupSettingsModal';
import { chatService } from '../services/chatService';
import { connectSocket } from '../services/socketClient';

export default function Chat() {
  const { user } = useAuth();
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversaDetails, setConversaDetails] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('sime_token');
    if (token) connectSocket(token);
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedConversa(id);
  }, []);

  const handleCreate = async (data) => {
    const res = await chatService.createConversa(data);
    const newId = res.data.id;
    setSelectedConversa(newId);
    setRefreshKey(k => k + 1);
  };

  const handleOpenSettings = async () => {
    if (!selectedConversa) return;
    try {
      const res = await chatService.getConversa(selectedConversa);
      setConversaDetails(res.data);
      setShowSettings(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-navy-900 rounded-2xl shadow-card overflow-hidden border border-gray-100 dark:border-navy-800">
      {/* Conversation List */}
      <div className={`w-80 border-r border-gray-100 dark:border-navy-700 flex-shrink-0 flex flex-col ${
        selectedConversa ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-navy-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Mensagens</h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <ConversationList key={refreshKey} selectedId={selectedConversa} onSelect={handleSelect} user={user} />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!selectedConversa ? 'hidden lg:flex' : 'flex'}`}>
        {selectedConversa ? (
          <ChatWindow
            key={selectedConversa}
            conversaId={selectedConversa}
            user={user}
            onBack={() => setSelectedConversa(null)}
            onOpenSettings={handleOpenSettings}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-30">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
            </svg>
            <h3 className="text-lg font-semibold mb-1">SIME Chat</h3>
            <p className="text-sm">Selecione uma conversa ou inicie uma nova</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4 inline mr-1.5" />
              Nova Conversa
            </button>
          </div>
        )}
      </div>

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
        user={user}
      />

      <GroupSettingsModal
        isOpen={showSettings}
        onClose={() => { setShowSettings(false); setConversaDetails(null); }}
        conversa={conversaDetails}
        user={user}
      />
    </div>
  );
}
