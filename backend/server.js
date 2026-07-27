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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'mongodb' });
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
