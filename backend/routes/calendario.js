const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { ano_letivo } = req.query;
    const filter = {};
    if (ano_letivo) {
      filter.ano_letivo = ano_letivo;
    }

    const eventos = await db.collection('calendario')
      .find(filter)
      .sort({ data_inicio: 1 })
      .toArray();

    res.json(eventos);
  } catch (error) {
    console.error('Erro ao buscar calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const evento = await db.collection('calendario').findOne({ _id: new ObjectId(req.params.id) });
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const { titulo, descricao, tipo, data_inicio, data_fim, ano_letivo, local, cor } = req.body;
    if (!titulo || !data_inicio) return res.status(400).json({ error: 'Título e data de início são obrigatórios' });

    const result = await db.collection('calendario').insertOne({
      titulo,
      descricao: descricao || '',
      tipo: tipo || 'feriado',
      data_inicio: new Date(data_inicio),
      data_fim: data_fim ? new Date(data_fim) : new Date(data_inicio),
      ano_letivo: ano_letivo || String(new Date().getFullYear()),
      local: local || '',
      cor: cor || '#0061a4',
      created_at: new Date()
    });
    res.status(201).json({ id: result.insertedId, message: 'Evento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar evento do calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const { titulo, descricao, tipo, data_inicio, data_fim, ano_letivo, local, cor } = req.body;
    const set = {};
    if (titulo !== undefined) set.titulo = titulo;
    if (descricao !== undefined) set.descricao = descricao;
    if (tipo !== undefined) set.tipo = tipo;
    if (data_inicio !== undefined) set.data_inicio = new Date(data_inicio);
    if (data_fim !== undefined) set.data_fim = new Date(data_fim);
    if (ano_letivo !== undefined) set.ano_letivo = ano_letivo;
    if (local !== undefined) set.local = local;
    if (cor !== undefined) set.cor = cor;

    const result = await db.collection('calendario').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: set }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json({ message: 'Evento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar evento do calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const result = await db.collection('calendario').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json({ message: 'Evento eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar evento do calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
