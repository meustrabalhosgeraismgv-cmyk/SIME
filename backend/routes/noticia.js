const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { instituicao_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filter = { publicada: 1 };

    if (instituicao_id) {
      filter.instituicao_id = instituicao_id;
    }

    const noticias = await db.collection('noticias').aggregate([
      { $match: filter },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: parseInt(limit) }
    ]).toArray();

    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

router.get('/destaque', async (req, res) => {
  try {
    const db = getDB();
    const noticias = await db.collection('noticias')
      .find({ publicada: 1, destaque: 1 })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar destaque' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const noticia = await db.collection('noticias').findOne({ _id: new ObjectId(req.params.id) });
    if (!noticia) return res.status(404).json({ error: 'Não encontrada' });
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, resumo, conteudo, categoria, imagem_url, instituicao_id, destaque } = req.body;

    const result = await db.collection('noticias').insertOne({
      titulo,
      resumo,
      conteudo,
      categoria: categoria || 'geral',
      imagem_url: imagem_url || null,
      autor: req.user.username,
      instituicao_id: instituicao_id || null,
      destaque: destaque || 0,
      publicada: 1,
      created_at: new Date()
    });

    res.status(201).json({ id: result.insertedId, message: 'Notícia criada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar notícia' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, resumo, conteudo, categoria, imagem_url, destaque, publicada } = req.body;

    await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        titulo, resumo, conteudo, categoria, imagem_url,
        destaque: destaque || 0,
        publicada: publicada ?? 1
      } }
    );
    res.json({ message: 'Atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('noticias').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
