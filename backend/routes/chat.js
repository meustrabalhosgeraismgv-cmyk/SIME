const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

const canCreateGroup = (perfil) => perfil === 'admin' || perfil === 'instituicao';
const canCreatePrivate = (perfil) => ['admin', 'instituicao', 'encarregado'].includes(perfil);

function toStr(v) {
  if (v == null) return v;
  return typeof v.toString === 'function' ? v.toString() : v;
}

function normalizarParticipante(p) {
  if (!p) return p;
  return { ...p, id: toStr(p._id), _id: p._id };
}

function normalizarMensagem(msg) {
  if (!msg) return msg;
  return {
    ...msg,
    id: toStr(msg._id),
    _id: msg._id,
    conversa_id: toStr(msg.conversa_id),
    remetente_id: toStr(msg.remetente_id)
  };
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

async function getOtherParticipant(conversaId, userId) {
  const db = getDB();
  const participante = await db.collection('conversa_participantes').aggregate([
    { $match: { conversa_id: conversaId, usuario_id: { $ne: userId } } },
    usuarioLookup('usuario', 'usuario_id'),
    { $unwind: '$usuario' },
    { $project: {
      _id: '$usuario._id', username: '$usuario.username', nome: '$usuario.nome',
      perfil: '$usuario.perfil', foto: '$usuario.foto',
      entidade_id: '$usuario.entidade_id', entidade_tipo: '$usuario.entidade_tipo'
    } }
  ]).toArray();
  const p = participante[0] || null;
  return normalizarParticipante(p);
}

async function getConversationInfo(conversaId, userId) {
  const db = getDB();
  const conversa = await db.collection('conversas').findOne({ _id: conversaId });
  if (!conversa) return null;

  const participantes = await db.collection('conversa_participantes').aggregate([
    { $match: { conversa_id: conversaId } },
    usuarioLookup('usuario', 'usuario_id'),
    { $unwind: '$usuario' },
    { $project: {
      _id: '$usuario._id', username: '$usuario.username', nome: '$usuario.nome',
      perfil: '$usuario.perfil', foto: '$usuario.foto',
      entidade_id: '$usuario.entidade_id', entidade_tipo: '$usuario.entidade_tipo', cargo: 1
    } }
  ]).toArray();

  const lastMsgDocs = await db.collection('mensagens').aggregate([
    { $match: { conversa_id: conversaId } },
    usuarioLookup('remetente', 'remetente_id'),
    { $unwind: { path: '$remetente', preserveNullAndEmptyArrays: true } },
    { $addFields: { remetente_nome: '$remetente.nome' } },
    { $sort: { created_at: -1 } },
    { $limit: 1 }
  ]).toArray();
  const lastMsg = normalizarMensagem(lastMsgDocs[0] || null);

  const participacao = await db.collection('conversa_participantes').findOne({
    conversa_id: conversaId, usuario_id: userId
  });
  const lidoAte = participacao?.lido_ate || new Date(0);

  const unread = await db.collection('mensagens').countDocuments({
    conversa_id: conversaId,
    remetente_id: { $ne: userId },
    created_at: { $gt: lidoAte }
  });

  return {
    ...conversa,
    id: toStr(conversa._id),
    participantes: participantes.map(normalizarParticipante),
    ultima_mensagem: lastMsg,
    nao_lidas: unread || 0
  };
}

router.get('/conversas', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const participacoes = await db.collection('conversa_participantes')
      .find({ usuario_id: req.user.id })
      .project({ conversa_id: 1 })
      .toArray();

    if (participacoes.length === 0) return res.json({ data: [] });

    const conversaIds = participacoes.map(p => p.conversa_id);
    const conversas = [];
    for (const cid of conversaIds) {
      const info = await getConversationInfo(cid, req.user.id);
      if (info) conversas.push(info);
    }

    conversas.sort((a, b) => {
      const ta = a.ultima_mensagem?.created_at || a.created_at;
      const tb = b.ultima_mensagem?.created_at || b.created_at;
      return new Date(tb) - new Date(ta);
    });

    res.json({ data: conversas });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

router.post('/conversas', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { tipo, nome, descricao, participantes } = req.body;
    const userId = req.user.id;
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });

    if (tipo === 'grupo' && !canCreateGroup(user.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para criar grupos' });
    }
    if (!canCreatePrivate(user.perfil) && tipo !== 'grupo') {
      return res.status(403).json({ error: 'Sem permissão para criar conversas' });
    }

    if (tipo === 'privada') {
      if (!participantes || participantes.length === 0) {
        return res.status(400).json({ error: 'Selecione pelo menos um participante' });
      }

      const otherUserId = participantes[0];
      const otherUser = await db.collection('usuarios').findOne({ _id: new ObjectId(otherUserId) });
      if (!otherUser) return res.status(404).json({ error: 'Utilizador não encontrado' });

      const existing = await db.collection('conversa_participantes').aggregate([
        { $match: { usuario_id: { $in: [userId, otherUserId] } } },
        { $group: { _id: '$conversa_id', count: { $sum: 1 } } },
        { $match: { count: 2 } },
        { $lookup: { from: 'conversas', localField: '_id', foreignField: '_id', as: 'conversa' } },
        { $unwind: '$conversa' },
        { $match: { 'conversa.tipo': 'privada' } },
        { $limit: 1 }
      ]).toArray();

      if (existing.length > 0) {
        return res.json({ id: toStr(existing[0]._id), message: 'Conversa já existe' });
      }

      const result = await db.collection('conversas').insertOne({
        tipo: 'privada', criado_por: userId, created_at: new Date(), updated_at: new Date()
      });
      const conversaId = result.insertedId;

      await db.collection('conversa_participantes').insertOne({ conversa_id: conversaId, usuario_id: userId, cargo: 'admin', lido_ate: new Date() });
      await db.collection('conversa_participantes').insertOne({ conversa_id: conversaId, usuario_id: otherUserId, cargo: 'membro', lido_ate: new Date() });

      res.status(201).json({ id: toStr(conversaId), message: 'Conversa criada' });

    } else if (tipo === 'grupo') {
      if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do grupo obrigatório' });
      if (!participantes || participantes.length < 1) return res.status(400).json({ error: 'Adicione pelo menos 1 participante' });

      const result = await db.collection('conversas').insertOne({
        tipo: 'grupo', nome: nome.trim(), descricao: descricao || null,
        criado_por: userId, created_at: new Date(), updated_at: new Date()
      });
      const conversaId = result.insertedId;

      await db.collection('conversa_participantes').insertOne({ conversa_id: conversaId, usuario_id: userId, cargo: 'admin', lido_ate: new Date() });

      for (const pid of participantes) {
        await db.collection('conversa_participantes').updateOne(
          { conversa_id: conversaId, usuario_id: pid },
          { $setOnInsert: { conversa_id: conversaId, usuario_id: pid, cargo: 'membro', lido_ate: new Date() } },
          { upsert: true }
        );
      }

      await db.collection('mensagens').insertOne({
        conversa_id: conversaId, remetente_id: userId,
        conteudo: `${req.user.username || 'Utilizador'} criou o grupo "${nome.trim()}"`,
        tipo: 'sistema', created_at: new Date()
      });

      res.status(201).json({ id: toStr(conversaId), message: 'Grupo criado' });
    }
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

router.get('/conversas/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const conversaId = new ObjectId(req.params.id);
    const participacao = await db.collection('conversa_participantes').findOne({
      conversa_id: conversaId, usuario_id: req.user.id
    });

    if (!participacao) return res.status(403).json({ error: 'Sem acesso a esta conversa' });

    const conversa = await getConversationInfo(conversaId, req.user.id);
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    res.json(conversa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

router.get('/conversas/:id/mensagens', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const conversaId = new ObjectId(req.params.id);
    const participacao = await db.collection('conversa_participantes').findOne({
      conversa_id: conversaId, usuario_id: req.user.id
    });

    if (!participacao) return res.status(403).json({ error: 'Sem acesso' });

    const { antes, limite = 50 } = req.query;
    const filter = { conversa_id: conversaId };
    if (antes) {
      filter._id = { $lt: new ObjectId(antes) };
    }

    const mensagens = await db.collection('mensagens').aggregate([
      { $match: filter },
      usuarioLookup('remetente', 'remetente_id'),
      { $unwind: { path: '$remetente', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        remetente_nome: '$remetente.nome',
        remetente_username: '$remetente.username',
        remetente_perfil: '$remetente.perfil',
        remetente_foto: '$remetente.foto'
      } },
      { $project: { remetente: 0 } },
      { $sort: { created_at: -1 } },
      { $limit: parseInt(limite) }
    ]).toArray();

    mensagens.reverse();

    await db.collection('conversa_participantes').updateOne(
      { conversa_id: conversaId, usuario_id: req.user.id },
      { $set: { lido_ate: new Date() } }
    );

    res.json({ data: mensagens.map(normalizarMensagem) });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

router.post('/conversas/:id/mensagens', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { conteudo, tipo = 'texto', ficheiro_url, respondendo_a } = req.body;
    if (!conteudo || !conteudo.trim()) return res.status(400).json({ error: 'Mensagem vazia' });

    const conversaId = new ObjectId(req.params.id);
    const participacao = await db.collection('conversa_participantes').findOne({
      conversa_id: conversaId, usuario_id: req.user.id
    });

    if (!participacao) return res.status(403).json({ error: 'Sem acesso' });

    const msgDoc = {
      conversa_id: conversaId,
      remetente_id: req.user.id,
      conteudo: conteudo.trim(),
      tipo,
      ficheiro_url: ficheiro_url || null,
      respondendo_a: respondendo_a || null,
      created_at: new Date()
    };

    const result = await db.collection('mensagens').insertOne(msgDoc);

    await db.collection('conversas').updateOne(
      { _id: conversaId },
      { $set: { updated_at: new Date() } }
    );

    const msgWithSender = await db.collection('mensagens').aggregate([
      { $match: { _id: result.insertedId } },
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

    const msg = normalizarMensagem(msgWithSender[0]);

    const io = req.app.get('io');
    if (io) {
      io.to('conversa:' + req.params.id).emit('new-message', msg);
    }

    res.status(201).json(msg);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.get('/utilizadores', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const filter = { aprovado: true, _id: { $ne: new ObjectId(req.user.id) } };

    if (user.perfil === 'admin') {
      // Admin can message everyone
    } else if (user.perfil === 'instituicao') {
      filter.perfil = { $in: ['admin', 'encarregado'] };
    } else if (user.perfil === 'encarregado') {
      filter.perfil = { $in: ['admin', 'instituicao'] };
    }

    const users = await db.collection('usuarios')
      .find(filter)
      .project({ password: 0 })
      .sort({ nome: 1, username: 1 })
      .toArray();

    res.json({ data: users.map(u => ({ ...u, id: toStr(u._id) })) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

router.post('/conversas/:id/participantes', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { usuario_id } = req.body;
    const conversaId = new ObjectId(req.params.id);

    const participacao = await db.collection('conversa_participantes').findOne({
      conversa_id: conversaId, usuario_id: req.user.id, cargo: 'admin'
    });

    if (!participacao) return res.status(403).json({ error: 'Sem permissão de admin' });

    const conversa = await db.collection('conversas').findOne({ _id: conversaId });
    if (!conversa || conversa.tipo !== 'grupo') return res.status(400).json({ error: 'Só é possível adicionar a grupos' });

    await db.collection('conversa_participantes').updateOne(
      { conversa_id: conversaId, usuario_id: usuario_id },
      { $setOnInsert: { conversa_id: conversaId, usuario_id: usuario_id, cargo: 'membro', lido_ate: new Date() } },
      { upsert: true }
    );

    const newUser = await db.collection('usuarios').findOne({ _id: new ObjectId(usuario_id) });
    await db.collection('mensagens').insertOne({
      conversa_id: conversaId, remetente_id: req.user.id,
      conteudo: `${req.user.username} adicionou ${newUser?.nome || newUser?.username || 'utilizador'}`,
      tipo: 'sistema', created_at: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to('conversa:' + req.params.id).emit('member-added', { usuario_id });
    }

    res.json({ message: 'Participante adicionado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar participante' });
  }
});

router.delete('/conversas/:id/participantes/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const conversaId = new ObjectId(req.params.id);

    const participacao = await db.collection('conversa_participantes').findOne({
      conversa_id: conversaId, usuario_id: req.user.id, cargo: 'admin'
    });

    if (!participacao) return res.status(403).json({ error: 'Sem permissão' });

    await db.collection('conversa_participantes').deleteOne({
      conversa_id: conversaId, usuario_id: req.params.userId
    });
    res.json({ message: 'Participante removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover participante' });
  }
});

module.exports = router;
