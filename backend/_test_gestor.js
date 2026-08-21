const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  // Simulate what /gestor does for gestor.bompastor
  const usuario = await db.collection('usuarios').findOne({ username: 'gestor.bompastor' });
  const instituicaoId = usuario?.entidade_id;
  console.log('Gestor entidade_id:', instituicaoId);

  const solicitacoes = await db.collection('solicitacoes').aggregate([
    { $match: { instituicao_id: new ObjectId(instituicaoId) } },
    {
      $lookup: {
        from: 'encarregados',
        let: { eid: { $toString: '$encarregado_id' } },
        pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$eid'] } } }],
        as: 'encarregado'
      }
    },
    { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
    { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'turmas', localField: 'turma_id', foreignField: '_id', as: 'turma' } },
    { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
    { $addFields: {
      encarregado_nome: '$encarregado.nome_completo',
      encarregado_telefone: '$encarregado.telefone',
      comunicado_titulo: '$comunicado.titulo',
      turma_nome: '$turma.nome',
      turma_nivel: '$turma.nivel'
    } },
    { $project: { encarregado: 0, comunicado: 0, turma: 0 } },
    { $sort: { created_at: -1 } }
  ]).toArray();

  console.log('Solicitacoes found:', solicitacoes.length);
  solicitacoes.forEach(s => {
    console.log(`  ${s.aluno_nome} | _id=${s._id} | encarregado_id=${s.encarregado_id} | instituicao_id=${s.instituicao_id} | estado=${s.estado}`);
  });

  // Check what toSolicitacao would return
  if (solicitacoes.length > 0) {
    const s = solicitacoes[0];
    console.log('\ntoSolicitacao result:', {
      id: s._id?.toString(),
      encarregado_id: s.encarregado_id?.toString(),
      instituicao_id: s.instituicao_id?.toString(),
      aluno_nome: s.aluno_nome,
    });
  }

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
