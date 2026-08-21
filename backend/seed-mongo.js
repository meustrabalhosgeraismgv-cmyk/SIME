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

const ENCARREGADO_DEMO = {
  username: 'enc.demonstracao',
  password: 'Demo@2026',
  nome: 'Maria dos Santos',
  email: 'maria.santos@mail.ao',
  telefone: '+244 923 000 111',
  perfil: 'encarregado'
};

const CLASSES_PRIMARIO = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
const CLASSES_MEDIO = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];

const ESCOLAS = [
  {
    nome: 'Escola Vila Seca',
    tipo: 'ensino_primario',
    descricao: 'A Escola Missionária Vilaseca Esparza fica no bairro da Aviação, na cidade de Huambo, em Angola. Oferece ensino primário e secundário com uma base cristã.',
    endereco: 'Bairro da Aviação, Huambo',
    lema: 'Educar com fé e saber',
    video_url: 'https://drive.google.com/file/d/1h_mHX815neDFyOBQDklPtHvQLsmx90Yp/preview',
    video_titulo: 'Escola Vila Seca - Apresentação',
    latitude: -12.7650,
    longitude: 15.7350,
    vagas: 360,
    classes: CLASSES_PRIMARIO
  },
  {
    nome: 'Escola Rei Livongue',
    tipo: 'ensino_medio',
    descricao: 'O Complexo Escolar Rei Livongue é uma instituição pública de ensino secundário no Bairro Calilongue, Huambo. Criada em 2016. 26 salas, 78 turmas, 3 turnos.',
    endereco: 'Bairro Calilongue, Huambo',
    lema: 'Conhecimento é poder',
    video_url: 'https://drive.google.com/file/d/1Mnsqpbi6yo_XKrt12rnStmo1k1eU3z96/preview',
    video_titulo: 'Escola Rei Livongue - Tour Virtual',
    latitude: -12.7700,
    longitude: 15.7400,
    vagas: 780,
    classes: CLASSES_MEDIO
  },
  {
    nome: 'Colégio Comandante Nzali',
    tipo: 'ensino_primario',
    descricao: 'O Colégio Comandante Nzali é uma instituição de ensino primário em Huambo. Formação integral dos alunos.',
    endereco: 'Huambo',
    lema: 'Disciplina e excelência',
    video_url: 'https://drive.google.com/file/d/1ZjWXLokBNk6zbCxgszfFnc3s-DqITkQX/preview',
    video_titulo: 'Colégio Comandante Nzali - Apresentação',
    latitude: -12.7720,
    longitude: 15.7380,
    vagas: 320,
    classes: CLASSES_PRIMARIO
  },
  {
    nome: 'Instituto Mensageiro',
    tipo: 'ensino_medio',
    descricao: 'O Instituto Mensageiro é uma instituição de ensino no bairro do Santo António, Huambo. Ensino médio com foco na formação técnica.',
    endereco: 'Santo António, Huambo',
    lema: 'Formar para o futuro',
    video_url: 'https://drive.google.com/file/d/1zXEOP2GQVJakiwqxYENS6u5beHi484sH/preview',
    video_titulo: 'Instituto Mensageiro - Conheça',
    latitude: -12.7680,
    longitude: 15.7330,
    vagas: 420,
    classes: CLASSES_MEDIO
  }
];

async function seedDatabase() {
  const db = getDB();

  const count = await db.collection('usuarios').countDocuments();
  if (count > 0) {
    console.log(`Base já populada (${count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed de demonstração...');

  const hashAdmin = bcrypt.hashSync(ADMIN.password, 10);
  const hashEnc = bcrypt.hashSync(ENCARREGADO_DEMO.password, 10);

  // --- Provincias ---
  const provincias = [
    { nome: 'Bengo', codigo: 'BGO' },
    { nome: 'Benguela', codigo: 'BEN' },
    { nome: 'Bié', codigo: 'BIE' },
    { nome: 'Cabinda', codigo: 'CAB' },
    { nome: 'Cuando Cubango', codigo: 'CCU' },
    { nome: 'Cuanza Norte', codigo: 'CNO' },
    { nome: 'Cuanza Sul', codigo: 'CUS' },
    { nome: 'Cunene', codigo: 'CNN' },
    { nome: 'Huambo', codigo: 'HUA' },
    { nome: 'Huíla', codigo: 'HUI' },
    { nome: 'Luanda', codigo: 'LUA' },
    { nome: 'Lunda Norte', codigo: 'LNO' },
    { nome: 'Lunda Sul', codigo: 'LSU' },
    { nome: 'Malanje', codigo: 'MAL' },
    { nome: 'Moxico', codigo: 'MOX' },
    { nome: 'Namibe', codigo: 'NAM' },
    { nome: 'Uíge', codigo: 'UIG' },
    { nome: 'Zaire', codigo: 'ZAI' }
  ];
  const provResult = await db.collection('provincias').insertMany(provincias);
  const provIds = {};
  Object.keys(provResult.insertedIds).forEach((k, i) => {
    provIds[provincias[i].nome] = provResult.insertedIds[k].toString();
  });

  // --- Municipios (Huambo focus + a few others) ---
  const municipios = [
    { nome: 'Huambo', prov: 'Huambo' },
    { nome: 'Longonjo', prov: 'Huambo' },
    { nome: 'Bailundo', prov: 'Huambo' },
    { nome: 'Ecunha', prov: 'Huambo' },
    { nome: 'Catchiungo', prov: 'Huambo' },
    { nome: 'Lumbo', prov: 'Huambo' },
    { nome: 'Caála', prov: 'Huambo' },
    { nome: 'Tchicala-Tcholohanga', prov: 'Huambo' },
    { nome: 'Chinjenje', prov: 'Huambo' },
    { nome: 'Ukuma', prov: 'Huambo' },
    { nome: 'Benguela', prov: 'Benguela' },
    { nome: 'Lobito', prov: 'Benguela' },
    { nome: 'Luanda', prov: 'Luanda' },
    { nome: 'Cacuaco', prov: 'Luanda' },
    { nome: 'Malanje', prov: 'Malanje' },
    { nome: 'Moçâmedes', prov: 'Namibe' }
  ].map(m => ({ ...m, provincia_id: provIds[m.prov] }));
  const munResult = await db.collection('municipios').insertMany(municipios);
  const munIds = {};
  Object.keys(munResult.insertedIds).forEach((k, i) => {
    munIds[municipios[i].nome] = munResult.insertedIds[k].toString();
  });

  // --- Admin user ---
  await db.collection('usuarios').insertOne({
    username: ADMIN.username,
    password: hashAdmin,
    nome: ADMIN.nome,
    email: ADMIN.email,
    telefone: ADMIN.telefone,
    perfil: 'admin',
    is_gestor: false,
    entidade_id: null,
    entidade_tipo: null,
    aprovado: true,
    foto: null,
    created_at: new Date()
  });

  // --- Escolas (WITHOUT gestores — gestores claim via registration) ---
  for (const escola of ESCOLAS) {
    const instResult = await db.collection('instituicoes').insertOne({
      nome: escola.nome,
      tipo: escola.tipo,
      municipio_id: munIds['Huambo'] || null,
      email: null,
      telefone: null,
      endereco: escola.endereco,
      latitude: escola.latitude,
      longitude: escola.longitude,
      vagas_totais: escola.vagas,
      vagas_disponiveis: Math.round(escola.vagas * 0.35),
      responsavel: null,
      logotipo_url: null,
      imagem_url: null,
      lema: escola.lema,
      descricao: escola.descricao,
      aceita_inscricao_online: true,
      aceita_inscricao_presencial: true,
      taxa_inscricao: 0,
      taxa_matricula: 0,
      status: 'ativa',
      created_at: new Date(),
      updated_at: new Date()
    });
    const instId = instResult.insertedId.toString();

    // Turmas
    const turmasDoc = escola.classes.map(n => ({
      nome: n,
      ano_letivo: 2026,
      nivel: n,
      instituicao_id: instId,
      professor_titular_id: null,
      vagas: 40,
      vagas_ocupadas: 0,
      estado: 'ativa',
      created_at: new Date()
    }));
    await db.collection('turmas').insertMany(turmasDoc);

    // Cursos
    const cursosDoc = escola.classes.map(n => ({
      instituicao_id: instId,
      nome: n,
      tipo: 'turma',
      grau: escola.tipo === 'ensino_primario' ? 'primario' : 'medio',
      duracao: '1 ano letivo',
      vagas_totais: 40,
      vagas_disponiveis: 40,
      turno: 'diurno',
      estado: 'ativo',
      created_at: new Date()
    }));
    await db.collection('cursos').insertMany(cursosDoc);

    // Informacoes instituicao
    await db.collection('informacoes_instituicao').insertOne({
      instituicao_id: instId,
      horario_atendimento: '08:00 - 16:00',
      dias_atendimento: 'Segunda a Sexta',
      documentos_necessarios: 'Bilhete de Identidade, Certificado, Atestado Médico',
      procedimentos_inscricao: 'Inscrição online através do SIME ou presencial na secretaria.',
      taxa_reserva_rupe: '',
      telefone_secretaria: null,
      email_secretaria: null,
      endereco_secretaria: escola.endereco,
      website: '',
      link_portal_estudante: '',
      notas_admissionais: '',
      created_at: new Date()
    });
  }

  // --- Encarregado demo ---
  const encResult = await db.collection('encarregados').insertOne({
    nome_completo: ENCARREGADO_DEMO.nome,
    telefone: ENCARREGADO_DEMO.telefone,
    bi: '005678901MB045',
    email: ENCARREGADO_DEMO.email,
    endereco: 'Huambo',
    created_at: new Date()
  });
  const encDemoId = encResult.insertedId.toString();

  await db.collection('usuarios').insertOne({
    username: ENCARREGADO_DEMO.username,
    password: hashEnc,
    nome: ENCARREGADO_DEMO.nome,
    email: ENCARREGADO_DEMO.email,
    telefone: ENCARREGADO_DEMO.telefone,
    perfil: 'encarregado',
    is_gestor: false,
    entidade_id: encDemoId,
    entidade_tipo: 'encarregado',
    aprovado: true,
    foto: null,
    created_at: new Date()
  });

  // --- Calendario events ---
  await db.collection('calendario').insertMany([
    { titulo: 'Início das Aulas', descricao: 'Início do ano lectivo 2026/2027', data_inicio: '2026-09-04', data_fim: '2026-09-04', tipo: 'inicio', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Férias de Natal', descricao: 'Recesso de Natal e Ano Novo', data_inicio: '2026-12-16', data_fim: '2027-01-05', tipo: 'ferias', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Exames Finais', descricao: 'Período de exames finais', data_inicio: '2027-05-20', data_fim: '2027-06-15', tipo: 'exame', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Fecho do Ano Lectivo', descricao: 'Entrega de resultados e encerramento', data_inicio: '2027-07-01', data_fim: '2027-07-05', tipo: 'fim', ano_letivo: 2027, created_at: new Date() }
  ]);

  // --- Configs ---
  await db.collection('configs').updateOne(
    { _id: 'system' },
    { $set: { hero: { imagem: null, titulo: '', subtitulo: '' } } },
    { upsert: true }
  );

  console.log(`Seed MongoDB completo! ${ESCOLAS.length} escolas de Huambo criadas (sem gestores atribuídos).`);
}

module.exports = { seedDatabase, ADMIN };
