require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/mongodb');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', credentials: true }
});

app.set('io', io);

const PORT = process.env.PORT || 3001;

async function start() {
  const mongoDb = await connectDB();

  if (mongoDb) {
    try {
      const { seedDatabase } = require('./seed-mongo');
      await seedDatabase();
    } catch (err) {
      console.error('Seed error:', err.message);
    }
  } else {
    console.warn('Sem MongoDB. Servidor inicia sem base de dados.');
  }

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const setupSocket = require('./socketHandler');
  setupSocket(io);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use((req, res, next) => {
    const { getDB } = require('./config/mongodb');
    if (!getDB() && req.path !== '/api/health') {
      return res.status(503).json({ error: 'Base de dados indisponível. Tente novamente mais tarde.' });
    }
    next();
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/instituicoes', require('./routes/instituicoes'));
  app.use('/api/alunos', require('./routes/alunos'));
  app.use('/api/professores', require('./routes/professores'));
  app.use('/api/turmas', require('./routes/turmas'));
  app.use('/api/matriculas', require('./routes/matriculas'));
  app.use('/api/encarregados', require('./routes/encarregados'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/noticias', require('./routes/noticia'));
  app.use('/api/calendario', require('./routes/calendario'));
  app.use('/api/comunicados', require('./routes/comunicados'));
  app.use('/api/solicitacoes', require('./routes/solicitacoes'));
  app.use('/api/pagamentos', require('./routes/pagamentos'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/cursos', require('./routes/cursos'));
  app.use('/api/informacoes', require('./routes/informacoes'));
  app.use('/api/taxa-reserva', require('./routes/taxaReserva'));
  app.use('/api/chat', require('./routes/chat'));

  app.get('/api/admin/migrate-coords', async (req, res) => {
    const { getDB } = require('./config/mongodb');
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB offline' });

    const COORDS = {
      'ISCED do Huambo': [-12.77475, 15.74914],
      'Universidade José Eduardo dos Santos': [-12.79815, 15.73324],
      'UJES': [-12.79815, 15.73324],
      'Politécnico Superior do Huambo': [-12.77581, 15.72912],
      'Universidade Católica': [-12.76632, 15.74850],
      'Faculdade de Artes': [-12.76632, 15.74850],
      'Faculdade de Direito do Huambo': [-12.79950, 15.73410],
      'Ciências da Saúde do Huambo': [-12.76815, 15.72590],
      'José Martí': [-12.77910, 15.73890],
      'Maria de Lurdes': [-12.78051, 15.73949],
      'Calunga II': [-12.78440, 15.72110],
      'Namunga': [-12.78051, 15.73949],
      'Politécnico do Huambo': [-12.77120, 15.74415],
      'Rei Livongue': [-12.76869, 15.72862],
      'nº 34': [-12.76750, 15.72480],
      'Augusto Ngangula': [-12.76750, 15.72480],
      'Dangereux': [-12.76105, 15.75780],
      'Cangombe': [-12.19056, 15.84945],
      '111 Benfica': [-12.75407, 15.74315],
      'Nº 111 Benfica': [-12.75407, 15.74315],
      'Nº 32': [-12.77674, 15.74200],
      'Nº 45 Caluquembe': [-12.73647, 15.78871],
      'Nº 78 Saiombo': [-12.77044, 15.80751],
      'Sonho dourado': [-12.77150, 15.74985],
      'Estrelinha': [-12.77150, 15.74985],
      'Crescer': [-12.19056, 15.84945],
      'Futuro': [-12.9000, 15.5500],
      '7 Cores': [-12.78865, 15.74124],
      'IGCA': [-12.77733, 15.73537],
    };

    const schools = await db.collection('instituicoes').find({}).toArray();
    let updated = 0;

    for (const s of schools) {
      let coords = null;
      for (const [key, val] of Object.entries(COORDS)) {
        if (s.nome && s.nome.includes(key)) { coords = val; break; }
      }
      if (coords) {
        await db.collection('instituicoes').updateOne(
          { _id: s._id },
          { $set: { lat: coords[0], lng: coords[1] } }
        );
        updated++;
      }
    }
    res.json({ message: `Migrated ${updated}/${schools.length} schools` });
  });

  app.get('/api/health', (req, res) => {
    const { getDB } = require('./config/mongodb');
    const db = getDB();
    res.json({
      status: db ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      db: db ? 'mongodb' : 'disconnected'
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor SIME rodando na porta ${PORT} (MongoDB)`);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});

module.exports = app;
