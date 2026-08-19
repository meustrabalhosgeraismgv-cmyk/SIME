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

const CLASSES_PRIMARIO = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
const CLASSES_MEDIO = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];

const ESCOLAS_HUAMBO = [
  {
    nome: 'Escola Primária do Bom Pastor',
    tipo: 'ensino_primario', municipio: 'Huambo', classes: CLASSES_PRIMARIO,
    latitude: -12.7688, longitude: 15.7316, vagas: 360, responsavel: 'Directora da Escola do Bom Pastor',
    lema: 'Educar com amor', gestor: 'gestor.bompastor'
  },
  {
    nome: 'Escola Primária 1º de Junho',
    tipo: 'ensino_primario', municipio: 'Huambo', classes: CLASSES_PRIMARIO,
    latitude: -12.7803, longitude: 15.7422, vagas: 320, responsavel: 'Director da Escola 1º de Junho',
    lema: 'Saber para servir', gestor: 'gestor.primeirojunho'
  },
  {
    nome: 'Escola Primária do Caluyembe',
    tipo: 'ensino_primario', municipio: 'Huambo', classes: CLASSES_PRIMARIO,
    latitude: -12.7581, longitude: 15.7574, vagas: 280, responsavel: 'Director da Escola do Caluyembe',
    lema: 'Crescer a aprender', gestor: 'gestor.caluyembe'
  },
  {
    nome: 'Escola Primária do Casseque',
    tipo: 'ensino_primario', municipio: 'Huambo', classes: CLASSES_PRIMARIO,
    latitude: -12.7714, longitude: 15.7508, vagas: 240, responsavel: 'Director da Escola do Casseque',
    lema: 'União, saber e progresso', gestor: 'gestor.casseque'
  },
  {
    nome: 'Escola do Ensino de Base do Centro',
    tipo: 'ensino_medio', municipio: 'Huambo', classes: CLASSES_MEDIO,
    latitude: -12.7767, longitude: 15.7412, vagas: 480, responsavel: 'Director da Escola do Centro',
    lema: 'Educar para o futuro', gestor: 'gestor.centro'
  },
  {
    nome: 'Escola Secundária 4 de Fevereiro',
    tipo: 'ensino_medio', municipio: 'Huambo', classes: CLASSES_MEDIO,
    latitude: -12.7741, longitude: 15.7355, vagas: 540, responsavel: 'Director da Escola 4 de Fevereiro',
    lema: 'Disciplina e excelência', gestor: 'gestor.4fevereiro'
  },
  {
    nome: 'Liceu do Huambo',
    tipo: 'ensino_secundario', municipio: 'Huambo', classes: CLASSES_MEDIO,
    latitude: -12.7799, longitude: 15.7388, vagas: 600, responsavel: 'Director do Liceu do Huambo',
    lema: 'Conhecimento é liberdade', gestor: 'gestor.liceu'
  },
  {
    nome: 'Instituto Médio Normal de Formação de Professores do Huambo',
    tipo: 'ensino_medio', municipio: 'Huambo', classes: CLASSES_MEDIO,
    latitude: -12.7644, longitude: 15.7521, vagas: 420, responsavel: 'Director do Instituto Médio Normal',
    lema: 'Formar quem educa', gestor: 'gestor.imnfp'
  },
  {
    nome: 'Escola Secundária da Caála',
    tipo: 'ensino_medio', municipio: 'Caála', classes: CLASSES_MEDIO,
    latitude: -12.8525, longitude: 15.5607, vagas: 380, responsavel: 'Director da Escola Secundária da Caála',
    lema: 'Estudar, vencer, servir', gestor: 'gestor.caala'
  },
  {
    nome: 'Escola Primária do Longonjo',
    tipo: 'ensino_primario', municipio: 'Longonjo', classes: CLASSES_PRIMARIO,
    latitude: -12.9123, longitude: 15.2547, vagas: 260, responsavel: 'Director da Escola do Longonjo',
    lema: 'A instrução é a base', gestor: 'gestor.longonjo'
  },
  {
    nome: 'Escola Secundária do Bailundo',
    tipo: 'ensino_medio', municipio: 'Bailundo', classes: CLASSES_MEDIO,
    latitude: -12.1939, longitude: 15.4559, vagas: 340, responsavel: 'Director da Escola do Bailundo',
    lema: 'Trabalho e sabedoria', gestor: 'gestor.bailundo'
  },
  {
    nome: 'Escola do Magistério Primário do Bailundo',
    tipo: 'ensino_primario', municipio: 'Bailundo', classes: CLASSES_PRIMARIO,
    latitude: -12.1987, longitude: 15.4621, vagas: 300, responsavel: 'Director do Magistério Primário do Bailundo',
    lema: 'Ensinar é transformar', gestor: 'gestor.magisterio'
  },
  {
    nome: 'Escola Primária da Ecunha',
    tipo: 'ensino_primario', municipio: 'Ecunha', classes: CLASSES_PRIMARIO,
    latitude: -12.6224, longitude: 15.4806, vagas: 220, responsavel: 'Director da Escola da Ecunha',
    lema: 'Aprender sempre', gestor: 'gestor.ecunha'
  },
  {
    nome: 'Escola Secundária do Catchiungo',
    tipo: 'ensino_medio', municipio: 'Catchiungo', classes: CLASSES_MEDIO,
    latitude: -12.5621, longitude: 16.2258, vagas: 320, responsavel: 'Director da Escola do Catchiungo',
    lema: 'Persistência e sucesso', gestor: 'gestor.catchiungo'
  }
];

async function seedDatabase() {
  const db = getDB();

  const count = await db.collection('usuarios').countDocuments();
  if (count > 0) {
    console.log(`Base já populada (${count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed de demonstração (escolas públicas do Huambo)...');
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
    { nome: 'Caála', prov: 'Huambo' }, { nome: 'Tchicala-Tcholohanga', prov: 'Huambo' },
    { nome: 'Chinjenje', prov: 'Huambo' }, { nome: 'Ukuma', prov: 'Huambo' },
    { nome: 'Benguela', prov: 'Benguela' }, { nome: 'Lobito', prov: 'Benguela' },
    { nome: 'Catumbela', prov: 'Benguela' }, { nome: 'Cuito', prov: 'Bié' },
    { nome: 'Camacupa', prov: 'Bié' }, { nome: 'Luanda', prov: 'Luanda' },
    { nome: 'Cacuaco', prov: 'Luanda' }, { nome: 'Viana', prov: 'Luanda' },
    { nome: 'Malanje', prov: 'Malanje' }, { nome: 'Moçâmedes', prov: 'Namibe' }
  ].map(m => ({ ...m, provincia_id: provIds[m.prov] }));
  const munResult = await db.collection('municipios').insertMany(municipios);
  const munIds = {};
  Object.keys(munResult.insertedIds).forEach((k, i) => { munIds[municipios[i].nome] = munResult.insertedIds[k].toString(); });

  const gestores = [];
  const instIds = {};

  for (const escola of ESCOLAS_HUAMBO) {
    const instResult = await db.collection('instituicoes').insertOne({
      nome: escola.nome,
      tipo: escola.tipo,
      municipio_id: munIds[escola.municipio] || null,
      email: `${escola.gestor}@sime.ao`,
      telefone: '+244 928 565 837',
      endereco: `${escola.municipio}, Huambo, Angola`,
      latitude: escola.latitude,
      longitude: escola.longitude,
      vagas_totais: escola.vagas,
      vagas_disponiveis: Math.round(escola.vagas * 0.35),
      responsavel: escola.responsavel,
      logotipo_url: null,
      imagem_url: null,
      lema: escola.lema,
      descricao: `${escola.nome} — instituição pública de ensino ${escola.tipo === 'ensino_primario' ? 'primário' : escola.tipo === 'ensino_secundario' ? 'secundário' : 'médio'} do município de ${escola.municipio}.`,
      aceita_inscricao_online: true,
      aceita_inscricao_presencial: true,
      taxa_inscricao: 0,
      taxa_matricula: 0,
      status: 'ativa',
      created_at: new Date(),
      updated_at: new Date()
    });
    const instId = instResult.insertedId.toString();
    instIds[escola.gestor] = instId;

    const turmasDoc = escola.classes.map(n => ({
      nome: n, ano_letivo: 2026, nivel: n, instituicao_id: instId,
      professor_titular_id: null, vagas: 40, vagas_ocupadas: 0, estado: 'ativa', created_at: new Date()
    }));
    await db.collection('turmas').insertMany(turmasDoc);

    const cursosDoc = escola.classes.map(n => ({
      instituicao_id: instId, nome: n, tipo: 'turma', grau: escola.tipo === 'ensino_primario' ? 'primario' : 'medio', duracao: '1 ano letivo',
      vagas_totais: 40, vagas_disponiveis: 40, turno: 'diurno', estado: 'ativo', created_at: new Date()
    }));
    await db.collection('cursos').insertMany(cursosDoc);

    await db.collection('informacoes_instituicao').insertOne({
      instituicao_id: instId,
      horario_atendimento: '08:00 - 16:00',
      dias_atendimento: 'Segunda a Sexta',
      documentos_necessarios: 'Bilhete de Identidade, Certificado, Atestado Médico',
      procedimentos_inscricao: 'Inscrição online através do SIME ou presencial na secretaria.',
      taxa_reserva_rupe: '',
      telefone_secretaria: '+244 928 565 837',
      email_secretaria: `secretaria@${escola.gestor}.sime.ao`,
      endereco_secretaria: `${escola.municipio}, Huambo, Angola`,
      website: '',
      link_portal_estudante: '',
      notas_admissionais: '',
      created_at: new Date()
    });

    gestores.push({
      username: escola.gestor, password: hashGestor, nome: escola.responsavel,
      email: `${escola.gestor}@sime.ao`, telefone: '+244 928 565 837', perfil: 'instituicao',
      is_gestor: true, entidade_id: instId, entidade_tipo: 'instituicao',
      aprovado: true, foto: null, created_at: new Date()
    });
  }

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
      is_gestor: true, entidade_id: instIds['gestor.bompastor'] || null, entidade_tipo: 'instituicao',
      aprovado: true, foto: null, created_at: new Date()
    },
    ...gestores
  ]);

  const encDemo = await db.collection('encarregados').insertOne({
    nome_completo: 'Maria dos Santos',
    telefone: '+244 923 000 111',
    bi: '005678901MB045',
    email: 'maria.santos@mail.ao',
    endereco: 'Huambo',
    created_at: new Date()
  });
  const encDemoId = encDemo.insertedId.toString();

  await db.collection('usuarios').insertOne({
    username: 'enc.demonstracao', password: hashGestor, nome: 'Maria dos Santos',
    email: 'maria.santos@mail.ao', telefone: '+244 923 000 111', perfil: 'encarregado',
    is_gestor: false, entidade_id: encDemoId, entidade_tipo: 'encarregado',
    aprovado: true, foto: null, created_at: new Date()
  });

  if (instIds['gestor.bompastor']) {
    await db.collection('alunos').insertOne({
      nome_completo: 'André dos Santos', data_nascimento: '2014-03-12', sexo: 'M',
      naturalidade: 'Huambo', numero_estudante: 'A2026DEMO1', bi: '004123456MB012',
      necessidades_especiais: '', encarregado_id: encDemoId,
      instituicao_id: instIds['gestor.bompastor'], estado: 'ativo', created_at: new Date()
    });
  }

  await db.collection('calendario').insertMany([
    { titulo: 'Início das Aulas', descricao: 'Início do ano lectivo 2026/2027', data_inicio: '2026-09-04', data_fim: '2026-09-04', tipo: 'inicio', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Férias de Natal', descricao: 'Recesso de Natal e Ano Novo', data_inicio: '2026-12-16', data_fim: '2027-01-05', tipo: 'ferias', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Exames Finais', descricao: 'Período de exames finais', data_inicio: '2027-05-20', data_fim: '2027-06-15', tipo: 'exame', ano_letivo: 2027, created_at: new Date() },
    { titulo: 'Fecho do Ano Lectivo', descricao: 'Entrega de resultados e encerramento', data_inicio: '2027-07-01', data_fim: '2027-07-05', tipo: 'fim', ano_letivo: 2027, created_at: new Date() }
  ]);

  await db.collection('configs').updateOne(
    { _id: 'system' },
    { $set: { hero: { imagem: null, titulo: '', subtitulo: '' } } },
    { upsert: true }
  );

  console.log(`Seed MongoDB de demonstração completo! ${ESCOLAS_HUAMBO.length} escolas públicas do Huambo criadas.`);
}

module.exports = { seedDatabase, ADMIN, GESTOR_DEMO, ESCOLAS_HUAMBO };