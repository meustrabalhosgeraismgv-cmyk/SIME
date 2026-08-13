const { getDB } = require('./config/mongodb');
const bcrypt = require('bcryptjs');

const ADMIN = {
  username: 'venancio',
  password: 'Venancio@2026',
  nome: 'Venâncio Elavoco Cassova Martins',
  email: 'venanciomartinse@gmail.com',
  telefone: '+244 928 565 837',
  perfil: 'admin'
};

const GESTOR_DEMO = {
  username: 'gestor.demonstracao',
  password: 'Demo@2026',
  nome: 'Gestor de Demonstração',
  email: 'gestor@demonstracao.sime.ao',
  telefone: '+244 928 565 837',
  perfil: 'instituicao'
};

async function seedDatabase() {
  const db = getDB();

  const count = await db.collection('usuarios').countDocuments();
  if (count > 0) {
    console.log(`Base já populada (${count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed de demonstração...');
  const hashAdmin = bcrypt.hashSync(ADMIN.password, 10);
  const hashGestor = bcrypt.hashSync(GESTOR_DEMO.password, 10);

  const provincias = [
    { nome: 'Bengo', codigo: 'BGO' }, { nome: 'Benguela', codigo: 'BEN' },
    { nome: 'Bié', codigo: 'BIE' }, { nome: 'Cabinda', codigo: 'CAB' },
    { nome: 'Cuando Cubango', codigo: 'CCU' }, { nome: 'Cuanza Norte', codigo: 'CNO' },
    { nome: 'Cuanza Sul', codigo: 'CUS' }, { nome: 'Cunene', codigo: 'CNN' },
    { nome: 'Huambo', codigo: 'HUA' }, { nome: 'Huíla', codigo: 'HUI' },
    { nome: 'Luanda', codigo: 'LUA' }, { nome: 'Lunda Norte', codigo: 'LNO' },
    { nome: 'Lunda Sul', codigo: 'LSU' }, { nome: 'Malanje', codigo: 'MAL' },
    { nome: 'Moxico', codigo: 'MOX' }, { nome: 'Namibe', codigo: 'NAM' },
    { nome: 'Uíge', codigo: 'UIG' }, { nome: 'Zaire', codigo: 'ZAI' }
  ];
  const provResult = await db.collection('provincias').insertMany(provincias);
  const provIds = {};
  Object.keys(provResult.insertedIds).forEach((k, i) => { provIds[provincias[i].nome] = provResult.insertedIds[k].toString(); });

  const municipios = [
    { nome: 'Huambo', prov: 'Huambo' }, { nome: 'Longonjo', prov: 'Huambo' },
    { nome: 'Bailundo', prov: 'Huambo' }, { nome: 'Ecunha', prov: 'Huambo' },
    { nome: 'Catchiungo', prov: 'Huambo' }, { nome: 'Lumbo', prov: 'Huambo' },
    { nome: 'Caála', prov: 'Huambo' }, { nome: 'Benguela', prov: 'Benguela' },
    { nome: 'Lobito', prov: 'Benguela' }, { nome: 'Catumbela', prov: 'Benguela' },
    { nome: 'Cuito', prov: 'Bié' }, { nome: 'Camacupa', prov: 'Bié' },
    { nome: 'Luanda', prov: 'Luanda' }, { nome: 'Cacuaco', prov: 'Luanda' },
    { nome: 'Viana', prov: 'Luanda' }, { nome: 'Malanje', prov: 'Malanje' },
    { nome: 'Moçâmedes', prov: 'Namibe' }
  ].map(m => ({ ...m, provincia_id: provIds[m.prov] }));
  const munResult = await db.collection('municipios').insertMany(municipios);
  const munIds = {};
  Object.keys(munResult.insertedIds).forEach((k, i) => { munIds[municipios[i].nome] = munResult.insertedIds[k].toString(); });

  const instResult = await db.collection('instituicoes').insertOne({
    nome: 'Escola de Demonstração SIME',
    tipo: 'ensino_medio',
    municipio_id: munIds['Huambo'],
    email: 'demonstracao@sime.ao',
    telefone: '+244 928 565 837',
    endereco: 'Huambo, Angola',
    latitude: -12.7767,
    longitude: 15.7412,
    vagas_totais: 480,
    vagas_disponiveis: 120,
    responsavel: 'Gestor de Demonstração',
    logotipo_url: null,
    imagem_url: null,
    lema: 'Educar para o futuro',
    descricao: 'Instituição de demonstração do SIME — Ensino Médio (7ª à 12ª Classe).',
    aceita_inscricao_online: true,
    aceita_inscricao_presencial: true,
    taxa_inscricao: 0,
    taxa_matricula: 0,
    status: 'ativa',
    created_at: new Date(),
    updated_at: new Date()
  });
  const instId = instResult.insertedId.toString();

  await db.collection('usuarios').insertMany([
    {
      username: ADMIN.username, password: hashAdmin, nome: ADMIN.nome,
      email: ADMIN.email, telefone: ADMIN.telefone, perfil: 'admin',
      is_gestor: false, entidade_id: null, entidade_tipo: null,
      aprovado: true, foto: null, created_at: new Date()
    },
    {
      username: GESTOR_DEMO.username, password: hashGestor, nome: GESTOR_DEMO.nome,
      email: GESTOR_DEMO.email, telefone: GESTOR_DEMO.telefone, perfil: 'instituicao',
      is_gestor: true, entidade_id: instId, entidade_tipo: 'instituicao',
      aprovado: true, foto: null, created_at: new Date()
    }
  ]);

  const turmasDoc = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'].map(n => ({
    nome: n, ano_letivo: 2026, nivel: n, instituicao_id: instId,
    professor_titular_id: null, vagas: 40, vagas_ocupadas: 0, estado: 'ativa', created_at: new Date()
  }));
  await db.collection('turmas').insertMany(turmasDoc);

  const turmasCursos = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'].map(n => ({
    instituicao_id: instId, nome: n, tipo: 'turma', grau: 'medio', duracao: '1 ano letivo',
    vagas_totais: 40, vagas_disponiveis: 40, turno: 'diurno', estado: 'ativo', created_at: new Date()
  }));
  await db.collection('cursos').insertMany(turmasCursos);

  await db.collection('calendario').insertMany([
    { titulo: 'Início das Aulas', descricao: 'Início do ano lectivo 2026/2027', data_inicio: '2026-09-04', data_fim: '2026-09-04', tipo: 'inicio', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Férias de Natal', descricao: 'Recesso de Natal e Ano Novo', data_inicio: '2026-12-16', data_fim: '2027-01-05', tipo: 'ferias', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Exames Finais', descricao: 'Período de exames finais', data_inicio: '2027-05-20', data_fim: '2027-06-15', tipo: 'exame', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Fecho do Ano Lectivo', descricao: 'Entrega de resultados e encerramento', data_inicio: '2027-07-01', data_fim: '2027-07-05', tipo: 'fim', ano_letivo: 2027, created_at: new Date() }
  ]);

  await db.collection('informacoes_instituicao').insertOne({
    instituicao_id: instId,
    horario_atendimento: '08:00 - 16:00',
    dias_atendimento: 'Segunda a Sexta',
    documentos_necessarios: 'Bilhete de Identidade, Certificado, Atestado Médico',
    procedimentos_inscricao: 'Inscrição online através do SIME ou presencial na secretaria.',
    taxa_reserva_rupe: '',
    telefone_secretaria: '+244 928 565 837',
    email_secretaria: 'secretaria@demonstracao.sime.ao',
    endereco_secretaria: 'Huambo, Angola',
    website: '',
    link_portal_estudante: '',
    notas_admissionais: '',
    created_at: new Date()
  });

  console.log('Seed MongoDB de demonstração completo!');
}

module.exports = { seedDatabase, ADMIN, GESTOR_DEMO };