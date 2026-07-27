const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { instituicao_id } = req.query;
    const filter = { publicado: 1 };
    if (instituicao_id) {
      filter.instituicao_id = instituicao_id;
    }

    const comunicados = await db.collection('comunicados').aggregate([
      { $match: filter },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: comunicados });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/gestor', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = usuario?.entidade_id;

    const comunicados = await db.collection('comunicados').aggregate([
      { $match: { instituicao_id: instituicaoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: comunicados });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, conteudo, tipo, instituicao_id, valor, data_inicio_inscricao, data_fim_inscricao } = req.body;

    const result = await db.collection('comunicados').insertOne({
      titulo,
      conteudo,
      tipo,
      instituicao_id,
      valor: valor || 0,
      data_inicio_inscricao: data_inicio_inscricao || null,
      data_fim_inscricao: data_fim_inscricao || null,
      publicado: 1,
      created_at: new Date()
    });

    res.status(201).json({ id: result.insertedId, message: 'Comunicado criado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, conteudo, tipo, valor, data_inicio_inscricao, data_fim_inscricao, publicado } = req.body;

    await db.collection('comunicados').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        titulo, conteudo, tipo, valor,
        data_inicio_inscricao, data_fim_inscricao,
        publicado: publicado ?? 1
      } }
    );
    res.json({ message: 'Atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('comunicados').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
