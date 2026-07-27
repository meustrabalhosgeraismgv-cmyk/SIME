const db = require('../config/database');

const getNoticias = (req, res) => {
  try {
    const { page = 1, limit = 10, categoria = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM noticias WHERE publicada = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM noticias WHERE publicada = 1';
    const params = [];
    const countParams = [];

    if (categoria) {
      query += ' AND categoria = ?';
      countQuery += ' AND categoria = ?';
      params.push(categoria);
      countParams.push(categoria);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const noticias = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: noticias,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
};

const getNoticiasDestaque = (req, res) => {
  try {
    const noticias = db.prepare(
      'SELECT * FROM noticias WHERE publicada = 1 AND destaque = 1 ORDER BY created_at DESC LIMIT 5'
    ).all();

    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias em destaque' });
  }
};

const getNoticiaById = (req, res) => {
  try {
    const { id } = req.params;
    const noticia = db.prepare(
      'SELECT * FROM noticias WHERE id = ? AND publicada = 1'
    ).get(id);

    if (!noticia) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícia' });
  }
};

module.exports = {
  getNoticias,
  getNoticiasDestaque,
  getNoticiaById
};
