const db = require('../config/database');

const getInstituicoes = (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tipo = '', municipio_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT i.*, m.nome as municipio_nome, p.nome as provincia_nome 
      FROM instituicoes i 
      LEFT JOIN municipios m ON i.municipio_id = m.id 
      LEFT JOIN provincias p ON m.provincia_id = p.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM instituicoes WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND i.nome LIKE ?';
      countQuery += ' AND nome LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (tipo) {
      query += ' AND i.tipo = ?';
      countQuery += ' AND tipo = ?';
      params.push(tipo);
      countParams.push(tipo);
    }

    if (municipio_id) {
      query += ' AND i.municipio_id = ?';
      countQuery += ' AND municipio_id = ?';
      params.push(municipio_id);
      countParams.push(municipio_id);
    }

    query += ' ORDER BY i.nome LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const instituicoes = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: instituicoes,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar instituições' });
  }
};

const getInstituicaoById = (req, res) => {
  try {
    const { id } = req.params;
    const instituicao = db.prepare(`
      SELECT i.*, m.nome as municipio_nome, p.nome as provincia_nome 
      FROM instituicoes i 
      LEFT JOIN municipios m ON i.municipio_id = m.id 
      LEFT JOIN provincias p ON m.provincia_id = p.id 
      WHERE i.id = ?
    `).get(id);

    if (!instituicao) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }

    res.json(instituicao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar instituição' });
  }
};

const createInstituicao = (req, res) => {
  try {
    const { nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, latitude, longitude } = req.body;

    const result = db.prepare(`
      INSERT INTO instituicoes (nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, vagas_disponiveis, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, vagas_totais, latitude || null, longitude || null);

    res.status(201).json({ message: 'Instituição criada com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar instituição' });
  }
};

const updateInstituicao = (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, vagas_disponiveis, status, latitude, longitude } = req.body;

    db.prepare(`
      UPDATE instituicoes 
      SET nome = ?, tipo = ?, endereco = ?, telefone = ?, email = ?, municipio_id = ?, vagas_totais = ?, vagas_disponiveis = ?, status = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `).run(nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, vagas_disponiveis || vagas_totais, status, latitude || null, longitude || null, id);

    res.json({ message: 'Instituição atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar instituição' });
  }
};

const deleteInstituicao = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM instituicoes WHERE id = ?').run(id);
    res.json({ message: 'Instituição removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover instituição' });
  }
};

const getEstatisticasInstituicao = (req, res) => {
  try {
    const { id } = req.params;

    const totalAlunos = db.prepare('SELECT COUNT(*) as total FROM alunos WHERE instituicao_id = ?').get(id);
    const totalProfessores = db.prepare('SELECT COUNT(*) as total FROM professores WHERE instituicao_id = ?').get(id);
    const totalTurmas = db.prepare('SELECT COUNT(*) as total FROM turmas WHERE instituicao_id = ?').get(id);
    const vagas = db.prepare('SELECT vagas_totais, vagas_disponiveis FROM instituicoes WHERE id = ?').get(id);

    res.json({
      total_alunos: totalAlunos.total,
      total_professores: totalProfessores.total,
      total_turmas: totalTurmas.total,
      vagas_totais: vagas?.vagas_totais || 0,
      vagas_disponiveis: vagas?.vagas_disponiveis || 0,
      ocupacao: vagas?.vagas_totais ? ((vagas.vagas_totais - vagas.vagas_disponiveis) / vagas.vagas_totais * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  getInstituicoes,
  getInstituicaoById,
  createInstituicao,
  updateInstituicao,
  deleteInstituicao,
  getEstatisticasInstituicao
};
