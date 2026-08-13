const db = require('./config/database');
const bcrypt = require('bcryptjs');

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

async function seedDatabase() {
  await db.ready;

  const result = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (result && result.count > 0) {
    console.log(`Base já populada (${result.count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed de demonstração...');

  const tables = [
    'pagamentos', 'solicitacoes', 'comunicados', 'notas', 'matriculas',
    'turmas', 'disciplinas', 'professores', 'alunos', 'encarregados',
    'alertas', 'estatisticas', 'noticias', 'usuarios', 'calendario',
    'cursos', 'informacoes_instituicao', 'instituicoes', 'municipios', 'provincias'
  ];
  tables.forEach(t => { try { db.exec(`DELETE FROM ${t}`); } catch(e) {} });

  const hashAdmin = bcrypt.hashSync(ADMIN.password, 10);
  const hashGestor = bcrypt.hashSync(GESTOR_DEMO.password, 10);

  db.exec("INSERT INTO provincias (nome, codigo) VALUES ('Huambo', 'HUA')");

  const insertMun = db.prepare('INSERT INTO municipios (nome, provincia_id) VALUES (?, (SELECT id FROM provincias WHERE nome = ?))');
  ['Huambo', 'Longonjo', 'Bailundo', 'Ecunha', 'Catchiungo', 'Lumbo', 'Caála']
    .forEach(m => insertMun.run(m, 'Huambo'));

  const insertEsc = db.prepare('INSERT INTO instituicoes (nome, tipo, municipio_id, latitude, longitude, vagas_totais, vagas_disponiveis, responsavel, telefone, email, status) VALUES (?, ?, (SELECT id FROM municipios WHERE nome = ?), ?, ?, ?, ?, ?, ?, ?, ?)');
  insertEsc.run('Escola de Demonstração SIME', 'ensino_medio', 'Huambo', -12.7767, 15.7412, 480, 120, 'Gestor de Demonstração', '+244 928 565 837', 'demonstracao@sime.ao', 'ativa');

  const insertUser = db.prepare('INSERT INTO usuarios (username, password, nome, email, telefone, perfil, is_gestor, entidade_id, entidade_tipo, aprovado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertUser.run(ADMIN.username, hashAdmin, ADMIN.nome, ADMIN.email, ADMIN.telefone, 'admin', 0, null, null, 1);

  const instDemo = db.prepare("SELECT id FROM instituicoes WHERE nome = 'Escola de Demonstração SIME'").get();
  if (instDemo) {
    insertUser.run(GESTOR_DEMO.username, hashGestor, GESTOR_DEMO.nome, GESTOR_DEMO.email, GESTOR_DEMO.telefone, 'instituicao', 1, instDemo.id, 'instituicao', 1);

    const insertTurma = db.prepare('INSERT INTO turmas (nome, ano_letivo, nivel, instituicao_id, vagas, vagas_ocupadas) VALUES (?, ?, ?, ?, ?, ?)');
    ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe']
      .forEach(n => insertTurma.run(n, 2026, n, instDemo.id, 40, 0));
  }

  console.log('Seed de demonstração completo!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}