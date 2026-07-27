const db = require('../config/database');

const getTurmas = (req, res) => {
  try {
    const { page = 1, limit = 10, instituicao_id = '', ano_letivo = '', nivel = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, i.nome as instituicao_nome, p.nome as professor_nome 
      FROM turmas t 
      LEFT JOIN instituicoes i ON t.instituicao_id = i.id 
      LEFT JOIN professores p ON t.professor_titular_id = p.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM turmas WHERE 1=1';
    const params = [];
    const countParams = [];

    if (instituicao_id) {
      query += ' AND t.instituicao_id = ?';
      countQuery += ' AND instituicao_id = ?';
      params.push(instituicao_id);
      countParams.push(instituicao_id);
    }

    if (ano_letivo) {
      query += ' AND t.ano_letivo = ?';
      countQuery += ' AND ano_letivo = ?';
      params.push(ano_letivo);
      countParams.push(ano_letivo);
    }

    if (nivel) {
      query += ' AND t.nivel = ?';
      countQuery += ' AND nivel = ?';
      params.push(nivel);
      countParams.push(nivel);
    }

    query += ' ORDER BY t.ano_letivo DESC, t.nome LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const turmas = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: turmas,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar turmas' });
  }
};

const getTurmaById = (req, res) => {
  try {
    const { id } = req.params;
    const turma = db.prepare(`
      SELECT t.*, i.nome as instituicao_nome, p.nome as professor_nome 
      FROM turmas t 
      LEFT JOIN instituicoes i ON t.instituicao_id = i.id 
      LEFT JOIN professores p ON t.professor_titular_id = p.id 
      WHERE t.id = ?
    `).get(id);

    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    const alunos = db.prepare(`
      SELECT a.*, m.estado as matricula_estado
      FROM alunos a
      INNER JOIN matriculas m ON a.id = m.aluno_id
      WHERE m.turma_id = ? AND m.estado = 'ativa'
      ORDER BY a.nome_completo
    `).all(id);

    res.json({ ...turma, alunos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar turma' });
  }
};

const createTurma = (req, res) => {
  try {
    const { nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas } = req.body;

    const result = db.prepare(`
      INSERT INTO turmas (nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas);

    res.status(201).json({ message: 'Turma criada com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar turma' });
  }
};

const updateTurma = (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas } = req.body;

    db.prepare(`
      UPDATE turmas 
      SET nome = ?, ano_letivo = ?, nivel = ?, instituicao_id = ?, professor_titular_id = ?, vagas = ?
      WHERE id = ?
    `).run(nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas, id);

    res.json({ message: 'Turma atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
};

const deleteTurma = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM turmas WHERE id = ?').run(id);
    res.json({ message: 'Turma removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover turma' });
  }
};

module.exports = {
  getTurmas,
  getTurmaById,
  createTurma,
  updateTurma,
  deleteTurma
};