const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Público: comunicados de uma instituição
router.get('/', (req, res) => {
  try {
    const { instituicao_id } = req.query;
    let query = 'SELECT c.*, i.nome as instituicao_nome FROM comunicados c LEFT JOIN instituicoes i ON c.instituicao_id = i.id WHERE c.publicado = 1';
    const params = [];
    if (instituicao_id) {
      query += ' AND c.instituicao_id = ?';
      params.push(instituicao_id);
    }
    query += ' ORDER BY c.created_at DESC';
    const comunicados = db.prepare(query).all(...params);
    res.json({ data: comunicados });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Gestor: CRUD
router.get('/gestor', authenticateToken, (req, res) => {
  try {
    const comunicados = db.prepare(
      'SELECT c.*, i.nome as instituicao_nome FROM comunicados c LEFT JOIN instituicoes i ON c.instituicao_id = i.id WHERE c.instituicao_id = (SELECT entidade_id FROM usuarios WHERE id=?) ORDER BY c.created_at DESC'
    ).all(req.user.id);
    res.json({ data: comunicados });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { titulo, conteudo, tipo, instituicao_id, valor, data_inicio_inscricao, data_fim_inscricao } = req.body;
    const result = db.prepare(
      'INSERT INTO comunicados (titulo, conteudo, tipo, instituicao_id, valor, data_inicio_inscricao, data_fim_inscricao) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(titulo, conteudo, tipo, instituicao_id, valor || 0, data_inicio_inscricao || null, data_fim_inscricao || null);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Comunicado criado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { titulo, conteudo, tipo, valor, data_inicio_inscricao, data_fim_inscricao, publicado } = req.body;
    db.prepare(
      'UPDATE comunicados SET titulo=?, conteudo=?, tipo=?, valor=?, data_inicio_inscricao=?, data_fim_inscricao=?, publicado=? WHERE id=?'
    ).run(titulo, conteudo, tipo, valor, data_inicio_inscricao, data_fim_inscricao, publicado ?? 1, req.params.id);
    res.json({ message: 'Atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM comunicados WHERE id=?').run(req.params.id);
    res.json({ message: 'Removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
