const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/:instituicaoId', (req, res) => {
  try {
    const { tipo } = req.query;
    let query = 'SELECT * FROM cursos WHERE instituicao_id = ?';
    const params = [req.params.instituicaoId];
    if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
    query += ' ORDER BY tipo, grau, nome';
    const cursos = db.prepare(query).all(...params);
    res.json({ data: cursos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

router.post('/:instituicaoId', authenticateToken, authorizeRole('admin', 'instituicao'), (req, res) => {
  try {
    const { nome, tipo, grau, duracao, vagas_totais, turno } = req.body;
    const result = db.prepare(
      'INSERT INTO cursos (instituicao_id, nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.params.instituicaoId, nome, tipo || 'curso', grau || 'licenciatura', duracao || null, vagas_totais || 0, vagas_totais || 0, turno || 'diurno');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Registo criado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar registo' });
  }
});

router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), (req, res) => {
  try {
    const { nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno, estado } = req.body;
    db.prepare(
      'UPDATE cursos SET nome=?, tipo=?, grau=?, duracao=?, vagas_totais=?, vagas_disponiveis=?, turno=?, estado=? WHERE id=?'
    ).run(nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno, estado, req.params.id);
    res.json({ message: 'Atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), (req, res) => {
  try {
    db.prepare('DELETE FROM cursos WHERE id=?').run(req.params.id);
    res.json({ message: 'Removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

module.exports = router;
