require('dotenv').config();
const { connectDB, getDB } = require('./config/mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  const db = await connectDB();
  if (!db) { console.error('Sem ligação.'); process.exit(1); }

  const encarregado = {
    nome_completo: 'Maria dos Santos',
    telefone: '+244 923 000 111',
    bi: '005678901MB045',
    email: 'maria.santos@mail.ao',
    endereco: 'Huambo'
  };

  const existente = await db.collection('usuarios').findOne({ username: 'enc.demonstracao' });
  if (existente) {
    console.log('enc.demonstracao já existe — nada a fazer.');
    process.exit(0);
  }

  let encId = null;
  const encExistente = await db.collection('encarregados').findOne({ bi: encarregado.bi });
  if (encExistente) {
    encId = encExistente._id.toString();
  } else {
    const r = await db.collection('encarregados').insertOne({ ...encarregado, created_at: new Date() });
    encId = r.insertedId.toString();
  }

  const hash = bcrypt.hashSync('Demo@2026', 10);
  await db.collection('usuarios').insertOne({
    username: 'enc.demonstracao', password: hash, nome: encarregado.nome_completo,
    email: encarregado.email, telefone: encarregado.telefone, perfil: 'encarregado',
    is_gestor: false, entidade_id: encId, entidade_tipo: 'encarregado',
    aprovado: true, foto: null, created_at: new Date()
  });
  console.log('enc.demonstracao criado, entidade_id =', encId);

  const bomPastor = await db.collection('instituicoes').findOne({ nome: 'Escola Primária do Bom Pastor' });
  if (bomPastor) {
    const instId = bomPastor._id.toString();
    const alunoExiste = await db.collection('alunos').findOne({ numero_estudante: 'A2026DEMO1' });
    if (!alunoExiste) {
      await db.collection('alunos').insertOne({
        nome_completo: 'André dos Santos', data_nascimento: '2014-03-12', sexo: 'M',
        naturalidade: 'Huambo', numero_estudante: 'A2026DEMO1', bi: '004123456MB012',
        necessidades_especiais: '', encarregado_id: encId,
        instituicao_id: instId, estado: 'ativo', created_at: new Date()
      });
      console.log('Aluno André dos Santos criado no Bom Pastor.');
    }
  } else {
    console.log('Aviso: Escola Primária do Bom Pastor não encontrada — aluno não criado.');
  }

  console.log('Credenciais demo encarregado: enc.demonstracao / Demo@2026');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });