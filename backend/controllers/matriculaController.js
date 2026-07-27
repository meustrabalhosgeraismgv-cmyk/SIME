const db = require('../config/database');

const getMatriculas = (req, res) => {
  try {
    const { page = 1, limit = 10, turma_id = '', ano_letivo = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT m.*, a.nome_completo as aluno_nome, a.numero_estudante, t.nome as turma_nome, i.nome as instituicao_nome
      FROM matriculas m 
      LEFT JOIN alunos a ON m.aluno_id = a.id 
      LEFT JOIN turmas t ON m.turma_id = t.id 
      LEFT JOIN instituicoes i ON t.instituicao_id = i.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM matriculas WHERE 1=1';
    const params = [];
    const countParams = [];

    if (turma_id) {
      query += ' AND m.turma_id = ?';
      countQuery += ' AND turma_id = ?';
      params.push(turma_id);
      countParams.push(turma_id);
    }

    if (ano_letivo) {
      query += ' AND m.ano_letivo = ?';
      countQuery += ' AND ano_letivo = ?';
      params.push(ano_letivo);
      countParams.push(ano_letivo);
    }

    query += ' ORDER BY m.data_matricula DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const matriculas = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: matriculas,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar matrículas' });
  }
};

const createMatricula = (req, res) => {
  try {
    const { aluno_id, turma_id, ano_letivo } = req.body;

    const existingMatricula = db.prepare(
      'SELECT id FROM matriculas WHERE aluno_id = ? AND turma_id = ? AND ano_letivo = ? AND estado = ?'
    ).get(aluno_id, turma_id, ano_letivo, 'ativa');

    if (existingMatricula) {
      return res.status(400).json({ error: 'Aluno já matriculado nesta turma' });
    }

    const turma = db.prepare('SELECT vagas, vagas_ocupadas FROM turmas WHERE id = ?').get(turma_id);
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    if (turma.vagas_ocupadas >= turma.vagas) {
      return res.status(400).json({ error: 'Turma sem vagas disponíveis' });
    }

    const result = db.prepare(
      'INSERT INTO matriculas (aluno_id, turma_id, ano_letivo) VALUES (?, ?, ?)'
    ).run(aluno_id, turma_id, ano_letivo);

    db.prepare('UPDATE turmas SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?').run(turma_id);

    const instituicao = db.prepare(`
      SELECT t.instituicao_id FROM turmas t WHERE t.id = ?
    `).get(turma_id);

    if (instituicao) {
      db.prepare('UPDATE instituicoes SET vagas_disponiveis = vagas_disponiveis - 1 WHERE id = ?').run(instituicao.instituicao_id);
    }

    res.status(201).json({ message: 'Matrícula realizada com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Aluno já matriculado nesta turma para o ano letivo' });
    }
    res.status(500).json({ error: 'Erro ao criar matrícula' });
  }
};

const cancelMatricula = (req, res) => {
  try {
    const { id } = req.params;
    
    const matricula = db.prepare('SELECT * FROM matriculas WHERE id = ?').get(id);
    if (!matricula) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    db.prepare('UPDATE matriculas SET estado = ? WHERE id = ?').run('cancelada', id);
    
    db.prepare('UPDATE turmas SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = ?').run(matricula.turma_id);

    const turma = db.prepare('SELECT instituicao_id FROM turmas WHERE id = ?').get(matricula.turma_id);
    if (turma) {
      db.prepare('UPDATE instituicoes SET vagas_disponiveis = vagas_disponiveis + 1 WHERE id = ?').run(turma.instituicao_id);
    }

    res.json({ message: 'Matrícula cancelada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar matrícula' });
  }
};

module.exports = {
  getMatriculas,
  createMatricula,
  cancelMatricula
};