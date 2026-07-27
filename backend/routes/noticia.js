const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET todas as notícias (público) ou da instituição (gestor)
router.get('/', (req, res) => {
  try {
    const { instituicao_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT n.*, i.nome as instituicao_nome FROM noticias n LEFT JOIN instituicoes i ON n.instituicao_id = i.id WHERE n.publicada = 1';
    const params = [];

    if (instituicao_id) {
      query += ' AND n.instituicao_id = ?';
      params.push(instituicao_id);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const noticias = db.prepare(query).all(...params);
    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

router.get('/destaque', (req, res) => {
  try {
    const noticias = db.prepare('SELECT * FROM noticias WHERE publicada = 1 AND destaque = 1 ORDER BY created_at DESC LIMIT 5').all();
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar destaque' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const noticia = db.prepare('SELECT * FROM noticias WHERE id = ?').get(req.params.id);
    if (!noticia) return res.status(404).json({ error: 'Não encontrada' });
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// CRUD gestor
router.post('/', authenticateToken, (req, res) => {
  try {
    const { titulo, resumo, conteudo, categoria, imagem_url, instituicao_id, destaque } = req.body;
    const result = db.prepare(
      'INSERT INTO noticias (titulo, resumo, conteudo, categoria, imagem_url, autor, instituicao_id, destaque) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(titulo, resumo, conteudo, categoria || 'geral', imagem_url || null, req.user.username, instituicao_id || null, destaque || 0);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Notícia criada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar notícia' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { titulo, resumo, conteudo, categoria, imagem_url, destaque, publicada } = req.body;
    db.prepare(
      'UPDATE noticias SET titulo=?, resumo=?, conteudo=?, categoria=?, imagem_url=?, destaque=?, publicada=? WHERE id=?'
    ).run(titulo, resumo, conteudo, categoria, imagem_url, destaque || 0, publicada ?? 1, req.params.id);
    res.json({ message: 'Atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM noticias WHERE id=?').run(req.params.id);
    res.json({ message: 'Removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
