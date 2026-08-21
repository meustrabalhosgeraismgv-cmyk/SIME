const http = require('http');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://meustrabalhosgeraismgv_db_user:pwQ2RZmwgLmRQt5c@cluster0.qc86dn4.mongodb.net/sime';
const JWT_SECRET = process.env.JWT_SECRET || 'sime_secret_key_2024';

(async () => {
  const c = await MongoClient.connect(uri);
  const db = c.db('sime');

  // Find Clara's user (Escola Primaria Martins)
  const user = await db.collection('usuarios').findOne({ username: 'Clara' });
  if (!user) { console.log('User Clara not found'); process.exit(1); }

  const token = jwt.sign({
    id: user._id.toString(),
    username: user.username,
    perfil: user.perfil,
    entidade_id: user.entidade_id,
    entidade_tipo: user.entidade_tipo
  }, JWT_SECRET, { expiresIn: '1h' });

  console.log('Token payload:', { id: user._id.toString(), entidade_id: user.entidade_id });

  // Test the /gestor endpoint
  const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/solicitacoes/gestor',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => console.error('Connection error:', e.message));
  req.end();

  await c.close();
})().catch(e => { console.error(e.message); process.exit(1); });
