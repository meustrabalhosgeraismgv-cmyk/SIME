const db = require('../config/database');

const getAlunos = (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', instituicao_id = '', estado = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, i.nome as instituicao_nome, e.nome as encarregado_nome 
      FROM alunos a 
      LEFT JOIN instituicoes i ON a.instituicao_id = i.id 
      LEFT JOIN encarregados e ON a.encarregado_id = e.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM alunos WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (a.nome_completo LIKE ? OR a.numero_estudante LIKE ?)';
      countQuery += ' AND (nome_completo LIKE ? OR numero_estudante LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (instituicao_id) {
      query += ' AND a.instituicao_id = ?';
      countQuery += ' AND instituicao_id = ?';
      params.push(instituicao_id);
      countParams.push(instituicao_id);
    }

    if (estado) {
      query += ' AND a.estado = ?';
      countQuery += ' AND estado = ?';
      params.push(estado);
      countParams.push(estado);
    }

    query += ' ORDER BY a.nome_completo LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const alunos = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: alunos,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

const getAlunoById = (req, res) => {
  try {
    const { id } = req.params;
    const aluno = db.prepare(`
      SELECT a.*, i.nome as instituicao_nome, e.nome as encarregado_nome, e.telefone as encarregado_telefone
      FROM alunos a 
      LEFT JOIN instituicoes i ON a.instituicao_id = i.id 
      LEFT JOIN encarregados e ON a.encarregado_id = e.id 
      WHERE a.id = ?
    `).get(id);

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const matriculas = db.prepare(`
      SELECT m.*, t.nome as turma_nome, t.ano_letivo, t.nivel
      FROM matriculas m 
      LEFT JOIN turmas t ON m.turma_id = t.id 
      WHERE m.aluno_id = ?
      ORDER BY m.ano_letivo DESC
    `).all(id);

    res.json({ ...aluno, matriculas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

const createAluno = (req, res) => {
  try {
    const { nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id } = req.body;

    const result = db.prepare(`
      INSERT INTO alunos (nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id);

    db.prepare('UPDATE instituicoes SET total_alunos = total_alunos + 1 WHERE id = ?').run(instituicao_id);

    res.status(201).json({ message: 'Aluno registado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Número de estudante já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar aluno' });
  }
};

const updateAluno = (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id, estado } = req.body;

    db.prepare(`
      UPDATE alunos 
      SET nome_completo = ?, data_nascimento = ?, sexo = ?, naturalidade = ?, numero_estudante = ?, encarregado_id = ?, instituicao_id = ?, estado = ?
      WHERE id = ?
    `).run(nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id, estado, id);

    res.json({ message: 'Aluno atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

const deleteAluno = (req, res) => {
  try {
    const { id } = req.params;
    const aluno = db.prepare('SELECT instituicao_id FROM alunos WHERE id = ?').get(id);
    
    db.prepare('DELETE FROM alunos WHERE id = ?').run(id);
    
    if (aluno) {
      db.prepare('UPDATE instituicoes SET total_alunos = total_alunos - 1 WHERE id = ?').run(aluno.instituicao_id);
    }
    
    res.json({ message: 'Aluno removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover aluno' });
  }
};

module.exports = {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno
};