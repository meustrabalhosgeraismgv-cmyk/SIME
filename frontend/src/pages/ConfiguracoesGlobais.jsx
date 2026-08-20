import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Loader2, Save, Wallet, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { configuracaoGlobalService } from '../services/api';

const ConfiguracoesGlobais = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    configuracaoGlobalService.get()
      .then(r => setConfig(r.data?.data || null))
      .catch(() => setAlertMsg({ type: 'error', message: 'Erro ao carregar configurações globais' }))
      .finally(() => setLoading(false));
  }, []);

  const salvar = async () => {
    if (!config) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      const res = await configuracaoGlobalService.salvar(config);
      setConfig(res.data?.data || config);
      setAlertMsg({ type: 'success', message: 'Configuração global guardada. A alteração aplica-se a todas as instituições sem mexer no código.' });
    } catch (e) {
      setAlertMsg({ type: 'error', message: e.response?.data?.error || 'Erro ao guardar configuração global' });
    } finally {
      setSaving(false);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = theme === 'dark'
    ? 'bg-navy-700 border-navy-600 text-white focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500';

  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Configurações Globais de Pagamento</h1>
            <p className={`text-sm ${subtext}`}>Gestão central do Administrador do Sistema — sem necessidade de alterar código no futuro</p>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            alertMsg.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <p className={`text-sm font-medium ${alertMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertMsg.message}</p>
            <button onClick={() => setAlertMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-500" />
            <h2 className={`text-lg font-semibold ${text}`}>Pagamento pela Plataforma (Gateway EMIS)</h2>
          </div>
          <div className="p-6 space-y-5">
            <button
              onClick={() => setConfig(prev => ({ ...prev, pagamento_plataforma_ativado: !prev?.pagamento_plataforma_ativado }))}
              className={`w-full p-5 rounded-2xl border text-left transition-all ${
                config?.pagamento_plataforma_ativado
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-navy-600 bg-gray-50 dark:bg-navy-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${text}`}>
                    {config?.pagamento_plataforma_ativado ? 'Ativado — pagamentos pela plataforma' : 'Desativado — apenas comprovativo'}
                  </p>
                  <p className={`text-xs ${subtext} mt-1`}>
                    {config?.pagamento_plataforma_ativado
                      ? 'Os encarregados pagam diretamente na plataforma com referência bancária gerada.'
                      : 'Os encarregados efetuam o pagamento e carregam o comprovativo; a instituição confirma.'}
                  </p>
                </div>
                <div className={`relative w-12 h-7 rounded-full transition-colors ${config?.pagamento_plataforma_ativado ? 'bg-green-500' : 'bg-gray-300 dark:bg-navy-600'}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${config?.pagamento_plataforma_ativado ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Gateway / Processador</label>
                <select value={config?.gateway || 'EMIS'}
                  onChange={e => setConfig(prev => ({ ...prev, gateway: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}>
                  <option value="EMIS">EMIS (Ministério da Educação)</option>
                  <option value="outro">Outro processador</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${subtext} mb-1`}>Notas (visíveis às instituições)</label>
              <textarea value={config?.notas || ''}
                onChange={e => setConfig(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none`}
                placeholder="Instruções sobre o estado do pagamento pela plataforma..." />
            </div>

            <div className={`p-4 rounded-xl border ${
              config?.pagamento_plataforma_ativado
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
            } flex items-start gap-3`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config?.pagamento_plataforma_ativado ? 'text-green-600' : 'text-amber-500'}`} />
              <p className={`text-xs ${subtext}`}>
                {config?.pagamento_plataforma_ativado
                  ? 'Quando ativado, todas as referências de pagamento passam a ser geradas pelo gateway e o botão "Pagar pela Plataforma" fica disponível aos encarregados em todas as instituições.'
                  : 'Quando o gateway da EMIS estiver integrado, basta ativar esta opção — todo o sistema passa a oferecer pagamento direto pela plataforma, sem alterações de código.'}
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={salvar} disabled={saving || !user || user.perfil !== 'admin'}
                className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" /> Guardar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesGlobais;