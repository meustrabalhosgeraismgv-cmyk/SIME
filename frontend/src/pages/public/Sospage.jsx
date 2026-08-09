import { useState } from 'react';
import { ShieldAlert, Send, Phone, User, Lock, CheckCircle2, Info } from 'lucide-react';
import { denunciaService } from '../../services/api';

const TIPOS = [
  { value: 'sos', label: 'SOS - Urgência', color: 'bg-red-50 text-red-700 border-red-200', icon: ShieldAlert },
  { value: 'denuncia', label: 'Denúncia', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Info },
  { value: 'sugerencia', label: 'Sugestão', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: User },
  { value: 'elogio', label: 'Elogio', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
];

const LINHAS = [
  { label: 'Linha SOS Criança', numero: '15015' },
  { label: 'Polícia Nacional', numero: '113' },
  { label: 'Bombeiros', numero: '115' },
  { label: 'Protecção Civil', numero: '121' },
];

export default function Sospage() {
  const [form, setForm] = useState({
    tipo: 'denuncia', assunto: '', descricao: '', local: '',
    anonimo: true, nome: '', telefone: '', email: '', instituicao_id: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assunto.trim() || !form.descricao.trim()) {
      setError('Assunto e descrição são obrigatórios.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await denunciaService.create(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-4">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-12">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Mensagem recebida!</h1>
          <p className="text-gray-600 mb-8">
            O seu comunicado foi registado de forma segura. A equipa de proteção escolar
            irá analisar e tomar as medidas necessárias. Obrigado pela sua contribuição.
          </p>
          <button onClick={() => { setSubmitted(false); setForm({ tipo: 'denuncia', assunto: '', descricao: '', local: '', anonimo: true, nome: '', telefone: '', email: '', instituicao_id: '' }); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0061a4] hover:bg-[#00497d] text-white rounded-xl font-semibold transition-colors">
            Enviar novo comunicado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0061a4] to-[#00497d] px-4 sm:px-8 py-16 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <ShieldAlert className="w-4 h-4" /> Canal Confidencial
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            SOS & Denúncias
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Um canal seguro e confidencial para denunciar violações, assédio, bullying,
            cobranças indevidas ou qualquer situação de risco nas escolas de Angola.
            Pode comunicar de forma anónima.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Registar um comunicado</h2>
          <p className="text-sm text-gray-500 mb-6">Os campos marcados com * são obrigatórios.</p>

          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de comunicado *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIPOS.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, tipo: t.value })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all ${
                      form.tipo === t.value ? 'border-[#0061a4] bg-[#0061a4]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <t.icon className="w-5 h-5 text-[#0061a4]" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto *</label>
                <input type="text" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                  placeholder="Ex.: Cobrança indevida de propinas" required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none focus:ring-2 focus:ring-[#0061a4]/20" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea rows={5} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descreva a situação com o máximo de detalhe: o que aconteceu, quando, onde e quem esteve envolvido."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none focus:ring-2 focus:ring-[#0061a4]/20 resize-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}
                  placeholder="Escola, sala, bairro..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID da instituição (se souber)</label>
                <input type="number" value={form.instituicao_id} onChange={(e) => setForm({ ...form, instituicao_id: e.target.value })}
                  placeholder="Opcional" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none" />
              </div>
            </div>

            {/* Anonimato */}
            <div className="rounded-2xl bg-gray-50 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.anonimo} onChange={(e) => setForm({ ...form, anonimo: e.target.checked })}
                  className="w-4 h-4 accent-[#0061a4]" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Quero permanecer anónimo(a)</p>
                  <p className="text-xs text-gray-500">A sua identidade não será registada nem divulgada.</p>
                </div>
              </label>

              {!form.anonimo && (
                <div className="grid gap-4 sm:grid-cols-3 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0061a4] outline-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> As informações são tratadas com confidencialidade.
              </p>
              <button type="submit" disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0061a4] hover:bg-[#00497d] disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                <Send className="w-4 h-4" /> {sending ? 'A enviar...' : 'Enviar comunicado'}
              </button>
            </div>
          </form>
        </div>

        {/* Linhas de emergência */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" /> Linhas de emergência
            </h3>
            <div className="space-y-3">
              {LINHAS.map(l => (
                <div key={l.numero} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-700">{l.label}</span>
                  <span className="text-lg font-extrabold text-[#0061a4]">{l.numero}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-red-50 border border-red-100 p-6">
            <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700" /> Em situação de perigo imediato
            </h3>
            <p className="text-sm text-red-800 leading-relaxed">
              Se um aluno, professor ou funcionário estiver em perigo imediato, contacte
              primeiro a linha de emergência ou a Polícia Nacional antes de utilizar este canal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
