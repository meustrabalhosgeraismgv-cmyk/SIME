const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

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

module.exports = router;
