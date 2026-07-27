const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  try {
    const { ano_letivo } = req.query;
    let query = 'SELECT * FROM calendario';
    const params = [];
    
    if (ano_letivo) {
      query += ' WHERE ano_letivo = ?';
      params.push(ano_letivo);
    }
    
    query += ' ORDER BY data_inicio ASC';
    
    const eventos = db.prepare(query).all(...params);
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao buscar calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const evento = db.prepare('SELECT * FROM calendario WHERE id = ?').get(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
