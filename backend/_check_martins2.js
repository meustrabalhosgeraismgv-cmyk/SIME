const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  // Find ALL institutions named "Martins" (partial match)
  const insts = await db.collection('instituicoes').find({ nome: /martins/i }).toArray();
  console.log('Instituições com "martins":', insts.length);
  insts.forEach(i => console.log(`  _id=${i._id} nome=${i.nome}`));

  // Check for all usuarios with entidade_tipo=instituicao
  const allGestores = await db.collection('usuarios').find({ entidade_tipo: 'instituicao' }).toArray();
  console.log('\nTodos os gestores:');
  allGestores.forEach(g => console.log(`  ${g.username} | entidade_id=${g.entidade_id} | aprovado=${g.aprovado}`));

  // Check recently created solicitacoes
  const recentSols = await db.collection('solicitacoes').find().sort({ created_at: -1 }).limit(5).toArray();
  console.log('\nSolicitações recentes:');
  recentSols.forEach(s => {
    console.log(`  ${s.aluno_nome} | encarregado_id=${s.encarregado_id} | instituicao_id=${s.instituicao_id} | created=${s.created_at}`);
  });

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
