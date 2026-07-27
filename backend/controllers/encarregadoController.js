const db = require('../config/database');

const getEncarregados = (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM encarregados WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM encarregados WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (nome_completo LIKE ? OR bi LIKE ? OR telefone LIKE ?)';
      countQuery += ' AND (nome_completo LIKE ? OR bi LIKE ? OR telefone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY nome_completo LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const encarregados = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: encarregados,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar encarregados' });
  }
};

const getEncarregadoById = (req, res) => {
  try {
    const { id } = req.params;
    const encarregado = db.prepare('SELECT * FROM encarregados WHERE id = ?').get(id);

    if (!encarregado) {
      return res.status(404).json({ error: 'Encarregado não encontrado' });
    }

    const alunos = db.prepare(`
      SELECT a.*, i.nome as instituicao_nome
      FROM alunos a
      LEFT JOIN instituicoes i ON a.instituicao_id = i.id
      WHERE a.encarregado_id = ?
    `).all(id);

    res.json({ ...encarregado, alunos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar encarregado' });
  }
};

const createEncarregado = (req, res) => {
  try {
    const { nome_completo, bi, telefone, email, endereco, profissao } = req.body;

    const result = db.prepare(`
      INSERT INTO encarregados (nome_completo, bi, telefone, email, endereco, profissao)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nome_completo, bi, telefone, email, endereco, profissao);

    res.status(201).json({ message: 'Encarregado registado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'BI já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao criar encarregado' });
  }
};

const updateEncarregado = (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, bi, telefone, email, endereco, profissao } = req.body;

    db.prepare(`
      UPDATE encarregados 
      SET nome_completo = ?, bi = ?, telefone = ?, email = ?, endereco = ?, profissao = ?
      WHERE id = ?
    `).run(nome_completo, bi, telefone, email, endereco, profissao, id);

    res.json({ message: 'Encarregado atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar encarregado' });
  }
};

const deleteEncarregado = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM encarregados WHERE id = ?').run(id);
    res.json({ message: 'Encarregado removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover encarregado' });
  }
};

module.exports = {
  getEncarregados,
  getEncarregadoById,
  createEncarregado,
  updateEncarregado,
  deleteEncarregado
};