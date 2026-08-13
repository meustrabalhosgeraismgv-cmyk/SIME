require('dotenv').config();
const { connectDB, getDB, closeDB } = require('./config/mongodb');

const COLECOES_APAGAR = [
  'usuarios',
  'instituicoes',
  'municipios',
  'provincias',
  'turmas',
  'alunos',
  'professores',
  'matriculas',
  'encarregados',
  'solicitacoes',
  'pagamentos',
  'comunicados',
  'noticias',
  'calendario',
  'cursos',
  'informacoes_instituicao',
  'documentos',
  'sms_mensagens',
  'verificacoes',
  'verificacoes_confirmadas',
  'conversas',
  'conversa_participantes',
  'mensagens',
  'denuncias',
  'classificacoes',
  'rh_funcionarios',
  'rh_avaliacoes',
  'alertas',
  'notificacoes',
  'estatisticas'
];

async function resetDatabase() {
  const db = await connectDB();
  if (!db) {
    console.error('Não foi possível ligar ao MongoDB.');
    process.exit(1);
  }

  console.log('A apagar todas as coleções de dados...');
  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map(c => c.name));

  for (const nome of COLECOES_APAGAR) {
    if (existingNames.has(nome)) {
      await db.collection(nome).drop();
      console.log(`  - ${nome} removida`);
    }
  }

  console.log('A executar seed de demonstração...');
  const { seedDatabase } = require('./seed-mongo');
  await seedDatabase();

  await closeDB();
  console.log('\nReset e seed concluídos com sucesso.');
  process.exit(0);
}

resetDatabase().catch(err => {
  console.error('Erro no reset:', err);
  process.exit(1);
});