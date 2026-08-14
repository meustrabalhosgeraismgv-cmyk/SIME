const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('./config/mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'sime_secret_key_2026';
const connectedUsers = new Map();

function toStr(v) {
  if (v == null) return v;
  return typeof v.toString === 'function' ? v.toString() : v;
}

function usuarioLookup(as, localField) {
  return {
    $lookup: {
      from: 'usuarios',
      let: { idVal: `$${localField}` },
      pipeline: [
        { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$idVal'] } } }
      ],
      as
    }
  };
}

async function buildMensagem(db, id) {
  const docs = await db.collection('mensagens').aggregate([
    { $match: { _id: id } },
    usuarioLookup('remetente', 'remetente_id'),
    { $unwind: { path: '$remetente', preserveNullAndEmptyArrays: true } },
    { $addFields: {
      remetente_nome: '$remetente.nome',
      remetente_username: '$remetente.username',
      remetente_perfil: '$remetente.perfil',
      remetente_foto: '$remetente.foto'
    } },
    { $project: { remetente: 0 } }
  ]).toArray();
  const msg = docs[0];
  if (!msg) return null;
  return {
    ...msg,
    id: toStr(msg._id),
    conversa_id: toStr(msg.conversa_id),
    remetente_id: toStr(msg.remetente_id)
  };
}

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Autenticação necessária'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);
    console.log(`[Socket] Utilizador ${userId} conectado`);

    const db = getDB();
    if (db) {
      try {
        const participacoes = await db.collection('conversa_participantes')
          .find({ usuario_id: userId })
          .project({ conversa_id: 1 })
          .toArray();
        participacoes.forEach(({ conversa_id }) => {
          socket.join('conversa:' + toStr(conversa_id));
        });
      } catch (err) {
        console.error('[Socket] Erro ao juntar conversas:', err.message);
      }
    }

    socket.join('user:' + userId);
    io.emit('online-users', Array.from(connectedUsers.keys()));

    socket.on('join-conversa', async (conversaId) => {
      const dbc = getDB();
      if (!dbc || !conversaId) return;
      try {
        const participacao = await dbc.collection('conversa_participantes').findOne({
          conversa_id: new ObjectId(toStr(conversaId)),
          usuario_id: userId
        });
        if (participacao) socket.join('conversa:' + toStr(conversaId));
      } catch (err) {
        console.error('[Socket] Erro em join-conversa:', err.message);
      }
    });

    socket.on('leave-conversa', (conversaId) => {
      if (conversaId) socket.leave('conversa:' + toStr(conversaId));
    });

    socket.on('send-message', async (data, callback) => {
      const dbc = getDB();
      if (!dbc) return callback?.({ error: 'Base de dados indisponível' });
      const { conversaId, conteudo, tipo = 'texto', ficheiro_url, respondendo_a } = data || {};
      if (!conteudo || !conteudo.trim()) return callback?.({ error: 'Mensagem vazia' });
      if (!conversaId) return callback?.({ error: 'Conversa inválida' });

      try {
        const cid = new ObjectId(toStr(conversaId));
        const participacao = await dbc.collection('conversa_participantes').findOne({
          conversa_id: cid,
          usuario_id: userId
        });
        if (!participacao) return callback?.({ error: 'Sem acesso' });

        const result = await dbc.collection('mensagens').insertOne({
          conversa_id: cid,
          remetente_id: userId,
          conteudo: conteudo.trim(),
          tipo,
          ficheiro_url: ficheiro_url || null,
          respondendo_a: respondendo_a || null,
          created_at: new Date()
        });

        await dbc.collection('conversas').updateOne(
          { _id: cid },
          { $set: { updated_at: new Date() } }
        );

        const msg = await buildMensagem(dbc, result.insertedId);
        if (msg) {
          io.to('conversa:' + toStr(cid)).emit('new-message', msg);
        }
        callback?.(msg);
      } catch (error) {
        console.error('[Socket] Erro ao enviar mensagem:', error);
        callback?.({ error: 'Erro ao enviar' });
      }
    });

    socket.on('typing', (conversaId) => {
      if (conversaId) socket.to('conversa:' + toStr(conversaId)).emit('user-typing', { userId, conversaId: toStr(conversaId) });
    });

    socket.on('stop-typing', (conversaId) => {
      if (conversaId) socket.to('conversa:' + toStr(conversaId)).emit('user-stop-typing', { userId, conversaId: toStr(conversaId) });
    });

    socket.on('mark-read', async (conversaId) => {
      const dbc = getDB();
      if (!dbc || !conversaId) return;
      try {
        await dbc.collection('conversa_participantes').updateOne(
          { conversa_id: new ObjectId(toStr(conversaId)), usuario_id: userId },
          { $set: { lido_ate: new Date() } }
        );
        socket.to('conversa:' + toStr(conversaId)).emit('message-read', { userId, conversaId: toStr(conversaId) });
      } catch (err) {
        console.error('[Socket] Erro em mark-read:', err.message);
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      io.emit('online-users', Array.from(connectedUsers.keys()));
      console.log(`[Socket] Utilizador ${userId} desconectado`);
    });
  });
}

module.exports = setupSocket;
