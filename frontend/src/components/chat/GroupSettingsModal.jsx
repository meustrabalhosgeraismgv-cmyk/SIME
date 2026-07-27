import { useState } from 'react';
import { X, Trash2, UserMinus, Crown, Shield } from 'lucide-react';
import { chatService } from '../../services/chatService';

export default function GroupSettingsModal({ isOpen, onClose, conversa, user }) {
  const [nome, setNome] = useState(conversa?.nome || '');
  const [descricao, setDescricao] = useState(conversa?.descricao || '');

  if (!isOpen || !conversa) return null;

  const participantes = conversa.participantes || [];
  const isAdmin = participantes.find(p => p.id === user?.id)?.cargo === 'admin';

  const handleRemove = async (userId) => {
    if (!confirm('Remover este participante?')) return;
    try {
      await chatService.removerParticipante(conversa.id, userId);
      onClose();
    } catch (e) {
      alert('Erro ao remover');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Configurações do Grupo</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
              {conversa.nome?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">{conversa.nome}</h4>
            <p className="text-sm text-gray-500">{participantes.length} membros</p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Membros ({participantes.length})</h5>
            <div className="space-y-2">
              {participantes.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-navy-800">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-navy-600 flex items-center justify-center text-xs font-bold text-white">
                    {(p.nome || p.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.nome || p.username}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {p.perfil === 'admin' ? 'Admin' : p.perfil === 'instituicao' ? 'Instituição' : 'Encarregado'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.cargo === 'admin' && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                    {p.cargo === 'moderador' && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                    {isAdmin && p.id !== user?.id && p.cargo !== 'admin' && (
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/10"
                      >
                        <UserMinus className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-navy-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
