import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Smartphone, Loader2, RefreshCw, Plus, UserPlus, PhoneCall,
  History, CheckCircle, Send, Globe, Zap, Lock
} from 'lucide-react';
import Loading from '../components/Loading';
import { ussdService, smsService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const UsSdPanel = () => {
  const { theme } = useTheme();
  const { showToast } = useNotifications();
  const [codigos, setCodigos] = useState([]);
  const [registos, setRegistos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telefone, setTelefone] = useState('');
  const [comando, setComando] = useState('');
  const [resultado, setResultado] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [showRegisto, setShowRegisto] = useState(false);
  const [regForm, setRegForm] = useState({ nome_completo: '', bi: '', telefone: '' });
  const [regResult, setRegResult] = useState(null);
  const [regSaving, setRegSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [codRes, regRes] = await Promise.all([
        ussdService.getCodigos().catch(() => ({ data: { data: [] } })),
        ussdService.getRegistos().catch(() => ({ data: { data: [] } })),
      ]);
      setCodigos(codRes.data.data || []);
      setRegistos(regRes.data.data || []);
    } catch (e) {
      showToast({ message: 'Erro ao carregar painel USSD', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const enviarComando = async (e) => {
    e.preventDefault();
    if (!telefone || !comando) {
      showToast({ message: 'Indique o telefone e o código USSD', type: 'error' });
      return;
    }
    setProcessing(true);
    setResultado(null);
    try {
      const res = await ussdService.entrada({ telefone, mensagem: comando });
      setResultado(res.data);
      showToast({ message: 'Resposta recebida', type: 'success' });
      ussdService.getRegistos().then(r => setRegistos(r.data.data || [])).catch(() => {});
    } catch (err) {
      showToast({ message: err.response?.data?.error || 'Erro ao processar código', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const enviarSmsBoasVindas = async (tel) => {
    try {
      await smsService.enviar({
        telefone: tel,
        mensagem: 'SIME — Bem-vindo ao serviço por SMS. Disque *100# para aceder ao menu sem internet, grátis.',
        destinatario_tipo: 'telemovel_analogico'
      });
      showToast({ message: 'SMS de boas-vindas enviado', type: 'success' });
    } catch (e) {
      showToast({ message: 'Erro ao enviar SMS', type: 'error' });
    }
  };

  const registarEncarregado = async (e) => {
    e.preventDefault();
    if (!regForm.nome_completo || !regForm.bi || !regForm.telefone) {
      showToast({ message: 'Preencha nome, BI e telefone', type: 'error' });
      return;
    }
    setRegSaving(true);
    setRegResult(null);
    try {
      const res = await ussdService.registarEncarregado(regForm);
      setRegResult(res.data);
      setRegForm({ nome_completo: '', bi: '', telefone: '' });
      showToast({ message: 'Encarregado registado com sucesso', type: 'success' });
    } catch (err) {
      showToast({ message: err.response?.data?.error || 'Erro ao registar encarregado', type: 'error' });
    } finally {
      setRegSaving(false);
    }
  };

  const bg = theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  if (loading) return <Loading text="A carregar painel USSD..." />;

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Serviço USSD — Códigos Rápidos</h1>
              <p className={`text-sm ${subtext}`}>Acesso por SMS/USSD para telemóveis analógicos — sem internet, instantâneo e grátis</p>
            </div>
          </div>
          <button onClick={load} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${text} text-sm font-medium`}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-primary-900/20 border-primary-800' : 'bg-primary-50 border-primary-200'}`}>
          <p className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-primary-300' : 'text-primary-700'}`}>
            <Zap className="w-4 h-4" />
            Os utilizadores com telemóveis analógicos disparam o número curto <strong>100</strong> e usam os códigos abaixo. Tudo é processado por SMS, sem necessidade de dados móveis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulador */}
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary-500" />
              <h2 className={`font-semibold ${text}`}>Simulador USSD</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Telefone do chamador</label>
                <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Ex: 923456789"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtext} mb-1`}>Código USSD</label>
                <input value={comando} onChange={e => setComando(e.target.value)} placeholder="Ex: *100*1*003456789LA004#"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <button onClick={enviarComando} disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Disparar Código
              </button>
              {resultado && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-100 dark:border-navy-700">
                  <p className={`text-xs font-semibold ${subtext} mb-2`}>Resposta enviada para {resultado.telefone}:</p>
                  <pre className={`whitespace-pre-wrap text-sm ${text} font-mono`}>{resultado.resposta}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Códigos */}
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-500" />
              <h2 className={`font-semibold ${text}`}>Códigos Rápidos ({codigos.length})</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {codigos.map((c, i) => (
                <div key={i} className="p-4">
                  <p className={`font-mono font-semibold ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}>{c.codigo}</p>
                  <p className={`text-xs ${subtext} mt-0.5`}>{c.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Registo de encarregado */}
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                <h2 className={`font-semibold ${text}`}>Registar Encarregado</h2>
              </div>
              <button onClick={() => setShowRegisto(!showRegisto)} className={`p-1.5 rounded-lg border ${card} ${text}`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showRegisto && (
              <form onSubmit={registarEncarregado} className="p-6 space-y-3">
                <input value={regForm.nome_completo} onChange={e => setRegForm({ ...regForm, nome_completo: e.target.value })} placeholder="Nome completo"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                <input value={regForm.bi} onChange={e => setRegForm({ ...regForm, bi: e.target.value })} placeholder="BI"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                <input value={regForm.telefone} onChange={e => setRegForm({ ...regForm, telefone: e.target.value })} placeholder="Telefone (ex: 923456789)"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${theme === 'dark' ? 'bg-navy-700 border-navy-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                <button type="submit" disabled={regSaving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {regSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Registar e Enviar Senha por SMS
                </button>
                {regResult && (
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Conta criada:</p>
                    <p className={`text-xs ${text}`}>Utilizador: <strong>{regResult.username}</strong></p>
                    <p className={`text-xs ${text}`}>Senha provisória: <strong>{regResult.senha_provisoria}</strong></p>
                    <button onClick={() => enviarSmsBoasVindas(regForm.telefone || regResult.sms?.telefone)}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary-500 hover:underline">
                      <PhoneCall className="w-3 h-3" /> Enviar SMS de boas-vindas
                    </button>
                  </div>
                )}
              </form>
            )}
            {!showRegisto && (
              <div className="p-6 text-center">
                <p className={`text-sm ${subtext}`}>Registe encarregados com telemóveis analógicos. As credenciais são enviadas por SMS instantaneamente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Registos */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center gap-2">
            <History className="w-5 h-5 text-primary-500" />
            <h2 className={`font-semibold ${text}`}>Registos de Sessões USSD ({registos.length})</h2>
          </div>
          {registos.length === 0 ? (
            <div className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={subtext}>Ainda não houve sessões USSD.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-navy-700' : 'border-gray-200'}`}>
                    <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Telefone</th>
                    <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Código</th>
                    <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Resposta</th>
                    <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${subtext}`}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {registos.map(r => (
                    <tr key={r._id} className={`border-b ${theme === 'dark' ? 'border-navy-700' : 'border-gray-100'}`}>
                      <td className="px-6 py-3 font-medium ${text}">{r.telefone}</td>
                      <td className="px-6 py-3"><code className={`px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-navy-700 text-primary-300' : 'bg-gray-100 text-primary-600'} text-xs`}>{r.comando}</code></td>
                      <td className={`px-6 py-3 text-xs ${subtext} max-w-xs truncate`}>{r.resposta}</td>
                      <td className={`px-6 py-3 text-xs ${subtext}`}>{new Date(r.created_at).toLocaleString('pt-AO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsSdPanel;