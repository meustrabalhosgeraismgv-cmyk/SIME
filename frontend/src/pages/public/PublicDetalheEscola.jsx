import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Users, Building2,
  BookOpen, X, Loader2, CheckCircle, Clock, FileText, CreditCard,
  Globe, ChevronDown, ChevronUp, School, Stethoscope
} from 'lucide-react';
import Loading from '../../components/Loading';
import { instituicaoService, solicitacaoService, cursoService, informacoesService, taxaReservaService } from '../../services/api';

const COLORS = {
  primaryBlue: '#2196F3', darkBlue: '#0D47A1', white: '#FFFFFF',
  grayBg: '#F4F6F8', green: '#4CAF50', orange: '#FF9800', red: '#F44336',
};

const DOCUMENTOS_POR_NIVEL = {
  pre_escolar: {
    titulo: 'Documentos para Pré-Escolar',
    documentos: [
      'Cédula Pessoal ou Assento de Nascimento ou Bilhete de Identidade (caso já possua)',
      '2 Fotografias tipo passe',
      'Documentos dos Pais: Bilhetes de Identidade',
      'Declaração de vacinação da criança',
    ],
    procedimento: 'Apresentar documentos na secretaria da instituição. As turmas são definidas por idade: Maternal (3-4 anos), Jardim I (4-5 anos), Jardim II (5-6 anos).',
    taxas: { inscricao: 1000, emolumentos: 5000 }
  },
  ensino_primario: {
    titulo: 'Documentos para Ensino Primário',
    documentos: [
      'Cédula Pessoal ou Assento de Nascimento ou Bilhete de Identidade',
      '2 Fotografias tipo passe',
      'Documentos dos Pais: Bilhetes de Identidade',
      'Certificado do Jardim de Infância (para Iniciação) OU documentos iniciais para quem não frequentou o Jardim',
      'Declaração de vacinação',
    ],
    procedimento: 'Para Iniciação (1ª classe): apresentar Certificado do Jardim de Infância ou Declaração. Para os restantes anos: apresentar Certificado da classe anterior.',
    taxas: { inscricao: 1000, emolumentos: 5000 }
  },
  ensino_medio: {
    titulo: 'Documentos para Ensino Médio',
    documentos: [
      'Bilhete de Identidade (original e cópia)',
      'Certificado da 9ª Classe com notas discriminadas',
      '4 Fotografias tipo passe recentes',
      'Atestado Médico',
      'Cartão de Vacinação',
      'Pasta de Processo',
      'Certificado de Nascimento',
    ],
    procedimento: 'Entregar documentos na secretaria académica. Acompanhar prazos de candidatura no portal ou na instituição.',
    taxas: { inscricao: 2000, emolumentos: 5000 }
  }
};

const TURNOS_LABEL = { diurno: 'Diurno', noturno: 'Noturno', ambos: 'Ambos' };

export default function PublicDetalheEscola() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [escola, setEscola] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [info, setInfo] = useState(null);
  const [taxaData, setTaxaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [solicitacaoLoading, setSolicitacaoLoading] = useState(false);
  const [solicitacaoSuccess, setSolicitacaoSuccess] = useState(false);
  const [solicitacaoError, setSolicitacaoError] = useState('');
  const [showDocs, setShowDocs] = useState(false);
  const [showProcs, setShowProcs] = useState(false);
  const [form, setForm] = useState({
    aluno_nome: '', aluno_data_nascimento: '', aluno_sexo: 'M',
    curso_id: '', provincia_origem: 'Huambo', municipio_origem: 'Huambo'
  });

  const isLoggedIn = !!localStorage.getItem('sime_token');
  const user = JSON.parse(localStorage.getItem('sime_user') || '{}');
  const isEncarregado = user?.perfil === 'encarregado';

  const PROVINCIAS = [
    'Bengo', 'Benguela', 'Bie', 'Cabinda', 'Cuando-Cubango', 'Cuanza Norte',
    'Cuanza Sul', 'Cunene', 'Huambo', 'Huila', 'Icolo e Bengo', 'Luanda',
    'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uige', 'Zaire'
  ];

  const isPreEscolar = escola?.tipo === 'pre_escolar';
  const isEnsinoPrimario = escola?.tipo === 'ensino_primario';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [escolaRes, statsRes, cursosRes, turmasRes, infoRes] = await Promise.all([
          instituicaoService.getById(id),
          instituicaoService.getEstatisticas(id).catch(() => null),
          cursoService.getByInstituicao(id).catch(() => ({ data: { data: [] } })),
          cursoService.getByInstituicao(id).catch(() => ({ data: { data: [] } })),
          informacoesService.getByInstituicao(id).catch(() => null),
        ]);
        setEscola(escolaRes.data);
        setEstatisticas(statsRes?.data || null);
        const allItems = cursosRes.data.data || [];
        setCursos(allItems.filter(c => c.tipo === 'curso'));
        setTurmas(allItems.filter(c => c.tipo === 'turma'));
        setInfo(infoRes?.data || null);
      } catch (err) {
        setError('Erro ao carregar dados da instituição.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (showSolicitacao && isLoggedIn && isEncarregado) {
      taxaReservaService.calcular({
        instituicao_id: id,
        provincia_origem: form.provincia_origem,
        municipio_origem: form.municipio_origem
      }).then(res => setTaxaData(res.data)).catch(() => setTaxaData(null));
    }
  }, [showSolicitacao, form.provincia_origem, form.municipio_origem, id, isLoggedIn, isEncarregado]);

  useEffect(() => {
    if (window.location.hash === '#solicitar') {
      setTimeout(() => setShowSolicitacao(true), 500);
    }
  }, []);

  const handleSolicitacao = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!isEncarregado) { setSolicitacaoError('Apenas encarregados de educação podem solicitar vagas.'); return; }
    if (!form.aluno_nome.trim()) { setSolicitacaoError('Preencha o nome do aluno.'); return; }
    setSolicitacaoLoading(true);
    setSolicitacaoError('');
    try {
      await solicitacaoService.create({
        instituicao_id: parseInt(id),
        aluno_nome: form.aluno_nome,
        aluno_data_nascimento: form.aluno_data_nascimento || null,
        aluno_sexo: form.aluno_sexo,
        curso_id: form.curso_id || null
      });
      setSolicitacaoSuccess(true);
    } catch (err) {
      setSolicitacaoError(err.response?.data?.error || 'Erro ao criar solicitação');
    } finally {
      setSolicitacaoLoading(false);
    }
  };

  const getOcupacao = () => {
    if (!estatisticas) return null;
    const total = estatisticas.vagas_totais || estatisticas.total_vagas || 0;
    const ocupadas = estatisticas.vagas_ocupadas || estatisticas.matriculas || 0;
    if (total === 0) return null;
    return { total, ocupadas, disponiveis: total - ocupadas, percentual: Math.round((ocupadas / total) * 100) };
  };

  const getOcupacaoColor = (pct) => pct < 70 ? COLORS.green : pct <= 95 ? COLORS.orange : COLORS.red;
  const nivelKey = isPreEscolar ? 'pre_escolar' : isEnsinoPrimario ? 'ensino_primario' : 'ensino_medio';
  const docsTemplate = DOCUMENTOS_POR_NIVEL[nivelKey];

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: COLORS.grayBg }}><Loading /></div>;
  if (error) return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.grayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: COLORS.red }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: COLORS.primaryBlue, color: COLORS.white, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Voltar</button>
    </div>
  );
  if (!escola) return null;

  const ocupacao = getOcupacao();
  const nome = escola.nome || 'Instituição';
  const municipio = escola.municipio_nome || '-';
  const tipoLabel = isPreEscolar ? 'Ensino Pré-Escolar' : isEnsinoPrimario ? 'Ensino Primário' : 'Ensino Médio';
  const itens = turmas;
  const documentosFinais = info?.documentos_necessarios ? info.documentos_necessarios.split(',').map(d => d.trim()) : docsTemplate?.documentos || [];
  const procedimentosFinais = info?.procedimentos_inscricao || docsTemplate?.procedimento || '';
  const taxas = docsTemplate?.taxas || { inscricao: 1000, emolumentos: 5000 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.grayBg, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', background: `linear-gradient(135deg, ${COLORS.darkBlue}, ${COLORS.primaryBlue})`, padding: '4rem 1.5rem 2.5rem', color: COLORS.white }}>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: COLORS.white, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '1rem' }}>
            <Building2 size={14} /> {tipoLabel}
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.75rem' }}>{nome}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', opacity: 0.9 }}><MapPin size={18} /> {municipio}</p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem 3rem', marginTop: '-1.5rem', position: 'relative', zIndex: 2 }}>

        {/* Vagas Overview */}
        {ocupacao && (
          <div style={{ backgroundColor: COLORS.white, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: getOcupacaoColor(ocupacao.percentual), lineHeight: 1, marginBottom: '0.5rem' }}>{ocupacao.percentual}%</div>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.25rem' }}>Vagas Ocupadas</p>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ height: '100%', width: `${Math.min(ocupacao.percentual, 100)}%`, backgroundColor: getOcupacaoColor(ocupacao.percentual), borderRadius: '9999px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.darkBlue }}>{ocupacao.total}</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total</div></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.orange }}>{ocupacao.ocupadas}</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Ocupadas</div></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.green }}>{ocupacao.disponiveis}</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Disponíveis</div></div>
            </div>
          </div>
        )}

        {/* Taxas de Inscrição */}
        <div style={{ backgroundColor: COLORS.white, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, color: COLORS.darkBlue, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CreditCard size={18} /> Taxas de Inscrição
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#E3F2FD', borderRadius: '0.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#1565C0', marginBottom: '0.25rem' }}>Inscrição</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.darkBlue }}>{taxas.inscricao.toLocaleString()} Kz</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', borderRadius: '0.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#2E7D32', marginBottom: '0.25rem' }}>Emolumentos de Reserva</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.green }}>{taxas.emolumentos.toLocaleString()} Kz</p>
            </div>
          </div>
        </div>

        {/* Turmas / Cursos */}
        {itens.length > 0 && (
          <div style={{ backgroundColor: COLORS.white, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${COLORS.grayBg}`, fontWeight: 600, color: COLORS.darkBlue, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={18} />
              {`Turmas / Classes (${itens.length})`}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Turma / Classe</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Turno</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Vagas</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${COLORS.grayBg}`, backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{c.nome}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{TURNOS_LABEL[c.turno] || c.turno}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ color: c.vagas_disponiveis > 0 ? COLORS.green : COLORS.red, fontWeight: 600 }}>{c.vagas_disponiveis}</span>
                        <span style={{ color: '#9CA3AF' }}> / {c.vagas_totais}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: c.estado === 'ativo' ? '#E8F5E9' : c.estado === 'lotado' ? '#FEE2E2' : '#F3F4F6', color: c.estado === 'ativo' ? COLORS.green : c.estado === 'lotado' ? COLORS.red : '#6B7280' }}>
                          {c.estado === 'ativo' ? 'Aberto' : c.estado === 'lotado' ? 'Lotado' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Informações da Instituição */}
        <div style={{ backgroundColor: COLORS.white, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${COLORS.grayBg}`, fontWeight: 600, color: COLORS.darkBlue, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Informações de Atendimento
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <InfoItem icon={<Clock size={18} />} label="Horário" value={`${info?.horario_atendimento || '08:00 - 15:00'} — ${info?.dias_atendimento || 'Segunda a Sexta'}`} color="#E3F2FD" iconColor={COLORS.primaryBlue} />
            <InfoItem icon={<Phone size={18} />} label="Telefone" value={info?.telefone_secretaria || escola.telefone || '-'} color="#E8F5E9" iconColor={COLORS.green} />
            <InfoItem icon={<Mail size={18} />} label="Email" value={info?.email_secretaria || escola.email || '-'} color="#F3E5F5" iconColor="#9C27B0" />
            <InfoItem icon={<MapPin size={18} />} label="Endereço" value={info?.endereco_secretaria || escola.endereco || '-'} color="#FFF3E0" iconColor={COLORS.orange} />
            {info?.website && <InfoItem icon={<Globe size={18} />} label="Website" value={info.website} color="#E0F7FA" iconColor="#00BCD4" />}
            {info?.link_portal_estudante && <InfoItem icon={<Globe size={18} />} label="Portal do Estudante" value={info.link_portal_estudante} color="#E8EAF6" iconColor="#3F51B5" />}
          </div>

          {/* Documentos */}
          <div style={{ borderTop: `1px solid ${COLORS.grayBg}` }}>
            <button onClick={() => setShowDocs(!showDocs)} style={{ width: '100%', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} color={COLORS.primaryBlue} /> {docsTemplate?.titulo || 'Documentos Necessários'}</span>
              {showDocs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showDocs && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '1rem' }}>
                  {documentosFinais.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.375rem 0' }}>
                      <CheckCircle size={14} color={COLORS.green} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Procedimentos */}
          <div style={{ borderTop: `1px solid ${COLORS.grayBg}` }}>
            <button onClick={() => setShowProcs(!showProcs)} style={{ width: '100%', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} color={COLORS.orange} /> Procedimentos de Inscrição</span>
              {showProcs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showProcs && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {procedimentosFinais || 'Não disponível'}
                </div>
                {info?.notas_admissionais && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#FFF3E0', borderRadius: '0.5rem', border: '1px solid #FFE0B2' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#E65100', margin: 0, fontWeight: 500 }}>Nota: {info.notas_admissionais}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RUPE */}
          {info?.taxa_reserva_rupe && (
            <div style={{ borderTop: `1px solid ${COLORS.grayBg}`, padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CreditCard size={16} color={COLORS.green} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Pagamento via RUPE — SIME</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', backgroundColor: '#F9FAFB', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>{info.taxa_reserva_rupe}</p>
            </div>
          )}
        </div>

        {/* Taxa de Reserva Calculada */}
        {isLoggedIn && isEncarregado && (
          <div style={{ backgroundColor: COLORS.white, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${COLORS.grayBg}`, fontWeight: 600, color: COLORS.darkBlue, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} /> Calculadora de Taxa de Reserva
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '1rem' }}>
                A taxa é calculada com base na distância até à instituição. Máximo 60% do custo real de passagem.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Sua Província</label>
                  <select value={form.provincia_origem} onChange={(e) => setForm({ ...form, provincia_origem: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Seu Município</label>
                  <input type="text" value={form.municipio_origem} onChange={(e) => setForm({ ...form, municipio_origem: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB', fontSize: '0.875rem' }} />
                </div>
              </div>
              {taxaData && (
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.darkBlue }}>{taxaData.distancia_km} km</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Distância</div></div>
                    <div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.orange }}>{taxaData.custo_passagem_ida_volta?.toLocaleString()} Kz</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Passagem Ida/Volta</div></div>
                    <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.green }}>{taxaData.taxa_reserva?.toLocaleString()} Kz</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Taxa de Reserva</div></div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#6B7280' }}>
                    <span>{taxaData.categoria === 'mesma_area' ? 'Mesma Área' : taxaData.categoria === 'mesma_provincia' ? 'Mesma Província' : 'Outra Província'}</span>
                    <span>•</span><span>Fila: {taxaData.fila_atual} pessoas</span>
                    {taxaData.em_periodo_enchente && <><span>•</span><span style={{ color: COLORS.orange }}>Época de chuvas</span></>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: `linear-gradient(135deg, ${COLORS.darkBlue}, ${COLORS.primaryBlue})`, borderRadius: '0.75rem', padding: '2rem', color: COLORS.white, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Interessado nesta instituição?</h2>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, marginBottom: '1.5rem' }}>Solicite a vaga do seu aluno ou entre em contato para mais informações.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => { if (!isLoggedIn) navigate('/login'); else setShowSolicitacao(true); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: COLORS.white, color: COLORS.darkBlue, fontSize: '0.9375rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Solicitar Vagas
            </button>
            {escola.telefone && (
              <a href={`tel:${escola.telefone.replace(/\D/g, '')}`} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', color: COLORS.white, fontSize: '0.9375rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} /> Contactar
              </a>
            )}
          </div>
        </div>

        {/* Modal de Solicitação */}
        {showSolicitacao && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ backgroundColor: COLORS.white, borderRadius: '1rem', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflow: 'auto' }}>
              {solicitacaoSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={32} color={COLORS.green} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2937', marginBottom: '0.5rem' }}>Solicitação Enviada!</h3>
                  <p style={{ color: '#6B7280', marginBottom: '1rem' }}>A sua solicitação foi enviada com sucesso.</p>
                  <div style={{ padding: '1rem', backgroundColor: '#F0F9FF', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.5rem' }}>Próximos passos:</p>
                    <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                      1. Efetue o pagamento da taxa de inscrição ({taxas.inscricao.toLocaleString()} Kz) + emolumentos ({taxas.emolumentos.toLocaleString()} Kz) via RUPE<br/>
                      2. Apresente os documentos na secretaria<br/>
                      3. Acompanhe o estado da solicitação na sua conta
                    </p>
                  </div>
                  <button onClick={() => { setShowSolicitacao(false); setSolicitacaoSuccess(false); }} style={{ padding: '0.75rem 2rem', borderRadius: '0.5rem', backgroundColor: COLORS.primaryBlue, color: COLORS.white, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Fechar</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2937', margin: 0 }}>Solicitar Vagas</h3>
                    <button onClick={() => { setShowSolicitacao(false); setSolicitacaoError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#F3F4F6', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, fontWeight: 500 }}>{nome}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0 0' }}>{tipoLabel} — {municipio}</p>
                  </div>

                  {solicitacaoError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#DC2626', margin: 0 }}>{solicitacaoError}</p>
                    </div>
                  )}

                  {!isLoggedIn && (
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#FFF3E0', border: '1px solid #FFE0B2', marginBottom: '1.5rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.875rem', color: '#E65100', margin: 0 }}>Precisa de conta de <strong>Encarregado de Educação</strong> para solicitar vagas.</p>
                      <button onClick={() => navigate('/cadastro')} style={{ marginTop: '0.75rem', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', backgroundColor: '#FF9800', color: COLORS.white, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Criar Conta</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Nome Completo do Aluno *</label>
                      <input type="text" value={form.aluno_nome} onChange={(e) => setForm({ ...form, aluno_nome: e.target.value })} placeholder="Nome completo" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Data de Nascimento</label>
                        <input type="date" value={form.aluno_data_nascimento} onChange={(e) => setForm({ ...form, aluno_data_nascimento: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Sexo</label>
                        <select value={form.aluno_sexo} onChange={(e) => setForm({ ...form, aluno_sexo: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', backgroundColor: COLORS.white }}>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                    </div>

                    {itens.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Turma / Classe Pretendida</label>
                        <select value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', backgroundColor: COLORS.white }}>
                          <option value="">Selecione...</option>
                          {itens.filter(c => c.estado === 'ativo').map(c => (
                            <option key={c.id} value={c.id}>{c.nome} — {c.vagas_disponiveis} vagas</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#FFF3E0', borderRadius: '0.5rem', border: '1px solid #FFE0B2' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#E65100', margin: 0, fontWeight: 500 }}>
                      Taxas: Inscrição {taxas.inscricao.toLocaleString()} Kz + Emolumentos {taxas.emolumentos.toLocaleString()} Kz
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0 0' }}>Pagamento via RUPE — SIME</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={() => { setShowSolicitacao(false); setSolicitacaoError(''); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', backgroundColor: COLORS.white, color: '#374151', fontWeight: 500, cursor: 'pointer', fontSize: '0.9375rem' }}>Cancelar</button>
                    <button onClick={handleSolicitacao} disabled={solicitacaoLoading || !isLoggedIn || !isEncarregado} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: COLORS.primaryBlue, color: COLORS.white, fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem', opacity: (solicitacaoLoading || !isLoggedIn || !isEncarregado) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {solicitacaoLoading ? <><Loader2 size={18} className="animate-spin" /> A enviar...</> : <><CheckCircle size={18} /> Enviar Solicitação</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, color, iconColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: color }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, fontWeight: 500, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '0.875rem', color: '#1F2937', fontWeight: 500, margin: '0.125rem 0 0', wordBreak: 'break-word' }}>{value}</p>
      </div>
    </div>
  );
}
