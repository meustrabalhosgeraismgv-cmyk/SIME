const db = require('../config/database');

const getProfessores = (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', instituicao_id = '', estado = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, i.nome as instituicao_nome 
      FROM professores p 
      LEFT JOIN instituicoes i ON p.instituicao_id = i.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM professores WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (p.nome_completo LIKE ? OR p.numero_funcionario LIKE ?)';
      countQuery += ' AND (nome_completo LIKE ? OR numero_funcionario LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (instituicao_id) {
      query += ' AND p.instituicao_id = ?';
      countQuery += ' AND instituicao_id = ?';
      params.push(instituicao_id);
      countParams.push(instituicao_id);
    }

    if (estado) {
      query += ' AND p.estado = ?';
      countQuery += ' AND estado = ?';
      params.push(estado);
      countParams.push(estado);
    }

    query += ' ORDER BY p.nome_completo LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const professores = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: professores,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professores' });
  }
};

const getProfessorById = (req, res) => {
  try {
    const { id } = req.params;
    const professor = db.prepare(`
      SELECT p.*, i.nome as instituicao_nome 
      FROM professores p 
      LEFT JOIN instituicoes i ON p.instituicao_id = i.id 
      WHERE p.id = ?
    `).get(id);

    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    const turmas = db.prepare(`
      SELECT t.*
      FROM turmas t 
      WHERE t.professor_titular_id = ?
      ORDER BY t.ano_letivo DESC
    `).all(id);

    res.json({ ...professor, turmas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professor' });
  }
};

const createProfessor = (req, res) => {
  try {
    const { nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id } = req.body;

    const result = db.prepare(`
      INSERT INTO professores (nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id);

    db.prepare('UPDATE instituicoes SET total_professores = total_professores + 1 WHERE id = ?').run(instituicao_id);

    res.status(201).json({ message: 'Professor registado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'BI ou número de funcionário já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar professor' });
  }
};

const updateProfessor = (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id, estado } = req.body;

    db.prepare(`
      UPDATE professores 
      SET nome_completo = ?, bi = ?, data_nascimento = ?, telefone = ?, email = ?, formacao = ?, especialidade = ?, numero_funcionario = ?, instituicao_id = ?, estado = ?
      WHERE id = ?
    `).run(nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id, estado, id);

    res.json({ message: 'Professor atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
};

const deleteProfessor = (req, res) => {
  try {
    const { id } = req.params;
    const professor = db.prepare('SELECT instituicao_id FROM professores WHERE id = ?').get(id);
    
    db.prepare('DELETE FROM professores WHERE id = ?').run(id);
    
    if (professor) {
      db.prepare('UPDATE instituicoes SET total_professores = total_professores - 1 WHERE id = ?').run(professor.instituicao_id);
    }
    
    res.json({ message: 'Professor removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover professor' });
  }
};

module.exports = {
  getProfessores,
  getProfessorById,
  createProfessor,
  updateProfessor,
  deleteProfessor
};