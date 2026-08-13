const db = require('./config/database');
const bcrypt = require('bcryptjs');
const initDatabase = require('./config/init-db');

const ADMIN = {
  username: 'venancio',
  password: 'Venancio@2026',
  nome: 'Venâncio Elavoco Cassova Martins',
  email: 'venanciomartinse@gmail.com',
  telefone: '+244 928 565 837'
};

const GESTOR_DEMO = {
  username: 'gestor.demonstracao',
  password: 'Demo@2026',
  nome: 'Gestor de Demonstração',
  email: 'gestor@demonstracao.sime.ao',
  telefone: '+244 928 565 837'
};

const seedDatabase = async () => {
  await db.ready;
  initDatabase();
  console.log('Iniciando seed de demonstração...');

  db.exec('DELETE FROM pagamentos');
  db.exec('DELETE FROM solicitacoes');
  db.exec('DELETE FROM comunicados');
  db.exec('DELETE FROM notas');
  db.exec('DELETE FROM matriculas');
  db.exec('DELETE FROM turmas');
  db.exec('DELETE FROM disciplinas');
  db.exec('DELETE FROM professores');
  db.exec('DELETE FROM alunos');
  db.exec('DELETE FROM encarregados');
  db.exec('DELETE FROM alertas');
  db.exec('DELETE FROM estatisticas');
  db.exec('DELETE FROM noticias');
  db.exec('DELETE FROM usuarios');
  db.exec('DELETE FROM calendario');
  db.exec('DELETE FROM cursos');
  db.exec('DELETE FROM informacoes_instituicao');
  db.exec('DELETE FROM instituicoes');
  db.exec('DELETE FROM municipios');
  db.exec('DELETE FROM provincias');

  const insertProvincia = db.prepare('INSERT OR IGNORE INTO provincias (nome, codigo) VALUES (?, ?)');
  insertProvincia.run('Huambo', 'HUA');

  const municipios = ['Huambo', 'Caála', 'Bailundo', 'Ekunha', 'Longonjo', 'Londuimbali', 'Mungo'];
  const insertMunicipio = db.prepare('INSERT OR IGNORE INTO municipios (nome, provincia_id) SELECT ?, id FROM provincias WHERE codigo = ?');
  for (const m of municipios) {
    insertMunicipio.run(m, 'HUA');
  }

  const insertInstituicao = db.prepare(`
    INSERT OR IGNORE INTO instituicoes (nome, tipo, municipio_id, latitude, longitude, vagas_totais, vagas_disponiveis, responsavel, email, telefone)
    SELECT ?, ?, m.id, ?, ?, ?, ?, ?, ?, ?
    FROM municipios m WHERE m.nome = ?
  `);
  insertInstituicao.run(
    'Escola de Demonstração SIME', 'ensino_medio', -12.7767, 15.7412, 480, 120,
    'Gestor de Demonstração', 'demonstracao@sime.ao', '+244 928 565 837', 'Huambo'
  );

  const senhaHashAdmin = bcrypt.hashSync(ADMIN.password, 10);
  const senhaHashGestor = bcrypt.hashSync(GESTOR_DEMO.password, 10);

  const insertUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (username, password, perfil, entidade_id, entidade_tipo, nome, email, telefone, is_gestor, aprovado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertUsuario.run(ADMIN.username, senhaHashAdmin, 'admin', null, null, ADMIN.nome, ADMIN.email, ADMIN.telefone, 0, 1);

  const instDemo = db.prepare("SELECT id FROM instituicoes WHERE nome = 'Escola de Demonstração SIME'").get();
  if (instDemo) {
    insertUsuario.run(GESTOR_DEMO.username, senhaHashGestor, 'instituicao', instDemo.id, 'instituicao', GESTOR_DEMO.nome, GESTOR_DEMO.email, GESTOR_DEMO.telefone, 1, 1);
  }

  const insertTurma = db.prepare('INSERT OR IGNORE INTO turmas (nome, ano_letivo, nivel, instituicao_id, vagas, vagas_ocupadas) VALUES (?, ?, ?, ?, ?, ?)');
  if (instDemo) {
    const niveis = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];
    for (const n of niveis) {
      insertTurma.run(n, 2026, n, instDemo.id, 40, 0);
    }
  }

  const insertCalendario = db.prepare('INSERT OR IGNORE INTO calendario (titulo, data_inicio, data_fim, tipo, descricao, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)');
  insertCalendario.run('Início do Ano Lectivo', '2026-09-04', null, 'inicio', 'Início oficial das aulas', 2026);
  insertCalendario.run('Férias de Natal', '2026-12-16', '2027-01-05', 'ferias', 'Férias de fim de ano', 2026);
  insertCalendario.run('Exames Finais', '2027-05-20', '2027-06-15', 'exame', 'Período de exames', 2027);

  console.log('Seed de demonstração concluído com sucesso!');
};

seedDatabase().catch(console.error);