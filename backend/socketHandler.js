const jwt = require('jsonwebtoken');
const db = require('./config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'sime_secret_key_2026';
const connectedUsers = new Map();

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Autenticação necessária'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);
    console.log(`[Socket] Utilizador ${userId} conectado`);

    const userConversas = db.prepare(
      'SELECT conversa_id FROM conversa_participantes WHERE usuario_id = ?'
    ).all(userId);

    userConversas.forEach(({ conversa_id }) => {
      socket.join('conversa:' + conversa_id);
    });

    socket.join('user:' + userId);

    io.emit('online-users', Array.from(connectedUsers.keys()));

    socket.on('join-conversa', (conversaId) => {
      const participacao = db.prepare(
        'SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?'
      ).get(conversaId, userId);

      if (participacao) {
        socket.join('conversa:' + conversaId);
      }
    });

    socket.on('leave-conversa', (conversaId) => {
      socket.leave('conversa:' + conversaId);
    });

    socket.on('send-message', (data, callback) => {
      try {
        const { conversaId, conteudo, tipo = 'texto', ficheiro_url, respondendo_a } = data;
        if (!conteudo || !conteudo.trim()) {
          return callback?.({ error: 'Mensagem vazia' });
        }

        const participacao = db.prepare(
          'SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?'
        ).get(conversaId, userId);

        if (!participacao) {
          return callback?.({ error: 'Sem acesso' });
        }

        const result = db.prepare(
          'INSERT INTO mensagens (conversa_id, remetente_id, conteudo, tipo, ficheiro_url, respondendo_a) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(conversaId, userId, conteudo.trim(), tipo, ficheiro_url || null, respondendo_a || null);

        db.prepare("UPDATE conversas SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(conversaId);

        const msg = db.prepare(`
          SELECT m.*, u.nome as remetente_nome, u.username as remetente_username, u.perfil as remetente_perfil, u.foto as remetente_foto
          FROM mensagens m JOIN usuarios u ON m.remetente_id = u.id WHERE m.id = ?
        `).get(result.lastInsertRowid);

        io.to('conversa:' + conversaId).emit('new-message', msg);
        callback?.(msg);
      } catch (error) {
        console.error('[Socket] Erro ao enviar mensagem:', error);
        callback?.({ error: 'Erro ao enviar' });
      }
    });

    socket.on('typing', (conversaId) => {
      socket.to('conversa:' + conversaId).emit('user-typing', { userId, conversaId });
    });

    socket.on('stop-typing', (conversaId) => {
      socket.to('conversa:' + conversaId).emit('user-stop-typing', { userId, conversaId });
    });

    socket.on('mark-read', (conversaId) => {
      db.prepare(
        "UPDATE conversa_participantes SET lido_ate = CURRENT_TIMESTAMP WHERE conversa_id = ? AND usuario_id = ?"
      ).run(conversaId, userId);
      socket.to('conversa:' + conversaId).emit('message-read', { userId, conversaId });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      io.emit('online-users', Array.from(connectedUsers.keys()));
      console.log(`[Socket] Utilizador ${userId} desconectado`);
    });
  });
}

module.exports = setupSocket;
