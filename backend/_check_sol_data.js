const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');
  const sols = await db.collection('solicitacoes').find().toArray();
  sols.forEach(s => {
    console.log(`=== ${s.aluno_nome} ===`);
    console.log('  documentos:', JSON.stringify(s.documentos));
    console.log('  formulario_respostas:', JSON.stringify(s.formulario_respostas));
    console.log('  observacoes:', s.observacoes);
    console.log('  necessidades_especiais:', s.necessidades_especiais);
  });
  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
