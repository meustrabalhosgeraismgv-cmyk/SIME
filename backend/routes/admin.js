const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Listar todos os utilizadores (admin only)
router.get('/users', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', perfil = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.nome, u.email, u.telefone, u.perfil, u.is_gestor, 
             u.entidade_id, u.entidade_tipo, u.aprovado, u.created_at,
             CASE 
               WHEN u.entidade_tipo = 'instituicao' THEN (SELECT nome FROM instituicoes WHERE id = u.entidade_id)
               ELSE NULL
             END as instituicao_nome
      FROM usuarios u
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (u.username LIKE ? OR u.nome LIKE ? OR u.email LIKE ?)';
      countQuery += ' AND (username LIKE ? OR nome LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (perfil) {
      query += ' AND u.perfil = ?';
      countQuery += ' AND perfil = ?';
      params.push(perfil);
      countParams.push(perfil);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({
      data: users,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

// Aprovar utilizador (admin only)
router.put('/users/:id/aprovar', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    db.prepare('UPDATE usuarios SET aprovado = 1 WHERE id = ?').run(id);
    res.json({ message: 'Utilizador aprovado com sucesso' });
  } catch (error) {
    console.error('Erro ao aprovar utilizador:', error);
    res.status(500).json({ error: 'Erro ao aprovar utilizador' });
  }
});

// Rejeitar/remover pendente (admin only)
router.put('/users/:id/rejeitar', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ message: 'Utilizador rejeitado/removido' });
  } catch (error) {
    console.error('Erro ao rejeitar utilizador:', error);
    res.status(500).json({ error: 'Erro ao rejeitar utilizador' });
  }
});

// Eliminar utilizador (admin only)
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    if (user.perfil === 'admin') {
      return res.status(400).json({ error: 'Não é possível eliminar administradores' });
    }
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
});

// Estatísticas do admin
router.get('/stats', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
    const pendingApprovals = db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE aprovado = 0').get();
    const usersByProfile = db.prepare(`
      SELECT perfil, COUNT(*) as total FROM usuarios GROUP BY perfil
    `).all();
    const totalInstituicoes = db.prepare('SELECT COUNT(*) as total FROM instituicoes').get();
    const totalAlunos = db.prepare('SELECT COUNT(*) as total FROM alunos').get();
    const totalProfessores = db.prepare('SELECT COUNT(*) as total FROM professores').get();

    res.json({
      total_utilizadores: totalUsers.total,
      pendentes_aprovacao: pendingApprovals.total,
      por_perfil: usersByProfile,
      total_instituicoes: totalInstituicoes.total,
      total_alunos: totalAlunos.total,
      total_professores: totalProfessores.total
    });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
