const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sime';

async function connectDB() {
  if (db) return db;
  client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
  });

  let retries = 3;
  while (retries > 0) {
    try {
      await client.connect();
      db = client.db();

      await db.collection('usuarios').createIndex({ username: 1 }, { unique: true });
      await db.collection('instituicoes').createIndex({ nome: 1 });
      await db.collection('municipios').createIndex({ nome: 1 });
      await db.collection('encarregados').createIndex({ bi: 1 }, { unique: true });
      await db.collection('professores').createIndex({ bi: 1 }, { unique: true });
      await db.collection('professores').createIndex({ numero_funcionario: 1 }, { unique: true });
      await db.collection('alunos').createIndex({ numero_estudante: 1 }, { unique: true });
      await db.collection('cursos').createIndex({ instituicao_id: 1 });
      await db.collection('turmas').createIndex({ instituicao_id: 1 });
      await db.collection('matriculas').createIndex({ aluno_id: 1, turma_id: 1, ano_letivo: 1 }, { unique: true });
      await db.collection('mensagens').createIndex({ conversa_id: 1, created_at: 1 });
      await db.collection('conversa_participantes').createIndex({ usuario_id: 1 });
      await db.collection('solicitacoes').createIndex({ instituicao_id: 1 });
      await db.collection('solicitacoes').createIndex({ encarregado_id: 1 });
      await db.collection('noticias').createIndex({ publicada: 1, created_at: -1 });
      await db.collection('calendario').createIndex({ data_inicio: 1 });

      console.log('MongoDB conectado:', db.databaseName);
      return db;
    } catch (err) {
      retries--;
      console.error(`MongoDB conexão falhou (${retries} restantes):`, err.message);
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  console.error('MongoDB: todas as tentativas falharam. Servidor continuará sem DB.');
  return null;
}

function getDB() {
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

process.on('SIGINT', () => { closeDB().then(() => process.exit()); });
process.on('SIGTERM', () => { closeDB().then(() => process.exit()); });

module.exports = { connectDB, getDB, closeDB };
