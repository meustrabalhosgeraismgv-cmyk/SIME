const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/gestor', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = usuario?.entidade_id;

    const solicitacoes = await db.collection('solicitacoes').aggregate([
      { $match: { instituicao_id: instituicaoId } },
      { $lookup: { from: 'encarregados', localField: 'encarregado_id', foreignField: '_id', as: 'encarregado' } },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
      { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        comunicado_titulo: '$comunicado.titulo'
      } },
      { $project: { encarregado: 0, comunicado: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: solicitacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/encarregado', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = usuario?.entidade_id;

    const solicitacoes = await db.collection('solicitacoes').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
      { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        instituicao_nome: '$instituicao.nome',
        comunicado_titulo: '$comunicado.titulo'
      } },
      { $project: { instituicao: 0, comunicado: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: solicitacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { instituicao_id, comunicado_id, aluno_nome, aluno_data_nascimento, aluno_sexo } = req.body;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = usuario?.entidade_id;
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const now = new Date();
    const result = await db.collection('solicitacoes').insertOne({
      encarregado_id: encarregadoId,
      instituicao_id,
      comunicado_id: comunicado_id || null,
      aluno_nome,
      aluno_data_nascimento: aluno_data_nascimento || null,
      aluno_sexo: aluno_sexo || null,
      estado: 'pendente',
      created_at: now
    });

    if (comunicado_id) {
      const comunicado = await db.collection('comunicados').findOne({ _id: new ObjectId(comunicado_id) });
      if (comunicado && comunicado.valor > 0) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + 3);
        await db.collection('pagamentos').insertOne({
          solicitacao_id: result.insertedId,
          instituicao_id,
          encarregado_id: encarregadoId,
          valor: comunicado.valor,
          tipo: 'reserva',
          data_limite: dataLimite,
          estado: 'pendente',
          created_at: now
        });
      }
    }

    res.status(201).json({ id: result.insertedId, message: 'Solicitação criada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/aceitar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'aceite', data_resposta: new Date() } }
    );
    res.json({ message: 'Aceite' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/rejeitar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'rejeitada', data_resposta: new Date(), observacoes: req.body.observacoes || '' } }
    );
    res.json({ message: 'Rejeitada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/agendar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'agendado', observacoes: req.body.observacoes || '' } }
    );
    res.json({ message: 'Agendado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/inscrever', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'inscrito', data_resposta: new Date() } }
    );
    res.json({ message: 'Inscrito' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
