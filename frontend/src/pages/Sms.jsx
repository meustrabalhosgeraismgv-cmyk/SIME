import { useState, useEffect } from 'react';
import { Send, MessageSquare, Users, CheckCircle2, AlertTriangle, RefreshCw, History } from 'lucide-react';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { smsService } from '../services/api';

const Sms = () => {
  const [sms, setSms] = useState([]);
  const [stats, setStats] = useState({ total: 0, enviados: 0, simulados: 0, comErro: 0, contactos: 0 });
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [alert, setAlert] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [formData, setFormData] = useState({ telefone: '', mensagem: '', destinatario_id: '' });

  useEffect(() => {
    loadData();
  }, [pagination.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [smsRes, statsRes, destRes] = await Promise.all([
        smsService.getAll({ page: pagination.page, limit: 10 }),
        smsService.getStats().catch(() => ({ data: { total: 0, enviados: 0, simulados: 0, comErro: 0, contactos: 0 } })),
        smsService.getDestinatarios().catch(() => ({ data: { data: [] } }))
      ]);
      setSms(smsRes.data.data);
      setPagination(smsRes.data.pagination);
      setStats(statsRes.data);
      setDestinatarios(destRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.telefone || !formData.mensagem.trim()) {
      setAlert({ type: 'error', message: 'Indique o telefone e a mensagem' });
      return;
    }
    try {
      setEnviando(true);
      const res = await smsService.enviar(formData);
      setAlert({
        type: res.data.estado === 'enviado' ? 'success' : 'warning',
        message: res.data.estado === 'enviado'
          ? 'SMS enviado com sucesso!'
          : `SMS registado como "${res.data.estado}". Configure o gateway no .env para envio real.`
      });
      setFormData({ telefone: '', mensagem: '', destinatario_id: '' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao enviar SMS' });
    } finally {
      setEnviando(false);
    }
  };

  const columns = [
    { header: 'Telefone', accessor: 'telefone', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.telefone}</span>
    )},
    { header: 'Destinatário', accessor: 'destinatario_nome' },
    { header: 'Mensagem', accessor: 'mensagem', render: (row) => (
      <span className="line-clamp-2 max-w-xs text-gray-600 dark:text-gray-300">{row.mensagem}</span>
    )},
    { header: 'Tipo', accessor: 'tipo', render: (row) => (
      <span className="capitalize">{row.tipo}</span>
    )},
    { header: 'Estado', accessor: 'estado', render: (row) => {
      const color = row.estado === 'enviado' ? 'bg-success-50 text-success-700' :
        row.estado === 'simulado' ? 'bg-warning-50 text-warning-700' : 'bg-error-50 text-error-700';
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color} dark:bg-opacity-10`}>{row.estado}</span>
      );
    }},
    { header: 'Data', accessor: 'created_at', render: (row) => (
      <span>{new Date(row.created_at).toLocaleString('pt-PT')}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SMS Pontual</h2>
          <p className="text-gray-500 dark:text-gray-400">Envio de mensagens pontuais aos Encarregados de Educação</p>
        </div>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total SMS</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-success">
          <p className="text-3xl font-bold text-success">{stats.enviados}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enviados</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-warning">
          <p className="text-3xl font-bold text-warning">{stats.simulados}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Simulados</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-error">
          <p className="text-3xl font-bold text-error">{stats.comErro}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Com Erro</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-primary">
          <p className="text-3xl font-bold text-primary">{stats.contactos}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Contactos</p>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-primary-500" /> Nova Mensagem
        </h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecionar Encarregado</label>
              <select
                value={formData.destinatario_id}
                onChange={(e) => {
                  const dest = destinatarios.find(d => d.id === e.target.value);
                  setFormData({
                    ...formData,
                    destinatario_id: e.target.value,
                    telefone: dest ? dest.telefone : ''
                  });
                }}
                className="input-field"
              >
                <option value="">— Escolher —</option>
                {destinatarios.map(d => (
                  <option key={d.id} value={d.id}>{d.nome_completo} ({d.telefone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone *</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="input-field"
                placeholder="+244 9XX XXX XXX"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem *</label>
              <textarea
                rows={3}
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                className="input-field resize-none"
                placeholder="Escreva a mensagem a enviar..."
                maxLength={480}
                required
              />
              <p className="text-xs text-gray-400 mt-1">{formData.mensagem.length}/480 caracteres</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={enviando} className="btn-primary flex items-center gap-2">
              {enviando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {enviando ? 'A enviar...' : 'Enviar SMS'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" /> Histórico de Mensagens
          </h3>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={sms}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        )}
      </div>
    </div>
  );
};

export default Sms;
