const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  // Find institution "Martins"
  const inst = await db.collection('instituicoes').findOne({ nome: /martins/i });
  console.log('Instituição:', inst ? { _id: inst._id.toString(), nome: inst.nome } : 'NÃO ENCONTRADA');

  // Find gestor linked to this institution
  if (inst) {
    const gestor = await db.collection('usuarios').findOne({ entidade_id: inst._id.toString() });
    console.log('Gestor:', gestor ? { username: gestor.username, entidade_id: gestor.entidade_id, perfil: gestor.perfil } : 'NÃO ENCONTRADO');

    // Find solicitacoes for this institution
    const sols = await db.collection('solicitacoes').aggregate([
      { $match: { instituicao_id: new ObjectId(inst._id.toString()) } },
      { $addFields: { id: { $toString: '$_id' }, enc_id: { $toString: '$encarregado_id' }, inst_id: { $toString: '$instituicao_id' } } },
      { $project: { aluno_nome: 1, id: 1, enc_id: 1, inst_id: 1, estado: 1, created_at: 1 } }
    ]).toArray();
    console.log('Solicitações para esta instituição:', sols.length);
    sols.forEach(s => console.log(`  ${s.aluno_nome} | inst_id=${s.inst_id} | enc_id=${s.enc_id} | estado=${s.estado}`));

    // Also check: all solicitacoes to see if any have this inst_id
    const allSols = await db.collection('solicitacoes').find({}, { projection: { aluno_nome: 1, instituicao_id: 1 } }).toArray();
    console.log('\nTodas as solicitações no sistema:');
    allSols.forEach(s => console.log(`  ${s.aluno_nome} | instituicao_id=${s.instituicao_id}`));
  }

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
