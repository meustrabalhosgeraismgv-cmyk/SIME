const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  // Check for recently created users (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUsers = await db.collection('usuarios').find({ created_at: { $gte: weekAgo } }).sort({ created_at: -1 }).toArray();
  console.log('Utilizadores criados nos últimos 7 dias:');
  recentUsers.forEach(u => console.log(`  ${u.username} | perfil=${u.perfil} | entidade_id=${u.entidade_id} | aprovado=${u.aprovado} | created=${u.created_at}`));

  // Check all solicitacoes to understand what the encarregado created
  const allSols = await db.collection('solicitacoes').find().sort({ created_at: -1 }).toArray();
  console.log('\nTodas as solicitações:');
  allSols.forEach(s => console.log(`  ${s.aluno_nome} | encarregado_id=${s.encarregado_id} | instituicao_id=${s.instituicao_id} | created=${s.created_at}`));

  // For each solicitation, find the encarregado name
  for (const s of allSols) {
    if (s.encarregado_id) {
      const enc = await db.collection('encarregados').findOne({ _id: new ObjectId(s.encarregado_id) });
      console.log(`  -> Encarregado: ${enc?.nome_completo || 'N/A'}`);
    }
  }

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
