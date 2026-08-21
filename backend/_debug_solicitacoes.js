const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  const solicitacoes = await db.collection('solicitacoes').find({}, { projection: { aluno_nome: 1, encarregado_id: 1, instituicao_id: 1, estado: 1, created_at: 1 } }).sort({ created_at: -1 }).limit(10).toArray();
  console.log('=== Solicitações ===');
  solicitacoes.forEach(s => {
    console.log(`  ${s.aluno_nome} | encarregado_id=${s.encarregado_id} | instituicao_id=${s.instituicao_id} | estado=${s.estado} | data=${s.created_at}`);
  });

  const usuarios = await db.collection('usuarios').find({ perfil: { $in: ['instituicao','encarregado'] } }, { projection: { username: 1, perfil: 1, entidade_id: 1 } }).toArray();
  console.log('\n=== Utilizadores ===');
  usuarios.forEach(u => {
    console.log(`  ${u.username} (${u.perfil}) | entidade_id=${u.entidade_id}`);
  });

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
