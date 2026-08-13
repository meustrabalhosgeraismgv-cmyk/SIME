const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '', perfil = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { nome: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (perfil) {
      filter.perfil = perfil;
    }

    const users = await db.collection('usuarios')
      .find(filter)
      .project({ password: 0 })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('usuarios').countDocuments(filter);

    const enrichedUsers = await Promise.all(users.map(async (u) => {
      if (u.entidade_tipo === 'instituicao' && u.entidade_id) {
        const inst = await db.collection('instituicoes').findOne({ _id: new ObjectId(u.entidade_id) });
        return { ...u, instituicao_nome: inst ? inst.nome : null };
      }
      return { ...u, instituicao_nome: null };
    }));

    res.json({
      data: enrichedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

router.put('/users/:id/aprovar', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    await db.collection('usuarios').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { aprovado: 1 } }
    );

    if (user.email) {
      const { enviarEmail } = require('../config/email');
      const { templateEmail } = require('../config/emailTemplate');
      await enviarEmail({
        to: user.email,
        subject: 'A sua conta no SIME foi aprovada',
        html: templateEmail({
          titulo: 'Conta aprovada ✓',
          mensagem: `Olá <strong>${user.nome || user.username}</strong>, a sua conta no SIME foi <strong>aprovada</strong> pelo administrador do sistema. Já pode iniciar sessão e utilizar a plataforma.`,
          nota: `Utilizador: <strong>${user.username}</strong>`,
          botaoTexto: 'Iniciar sessão',
          botaoUrl: 'https://sime-gov.vercel.app/login'
        })
      });
    }

    res.json({ message: 'Utilizador aprovado com sucesso' });
  } catch (error) {
    console.error('Erro ao aprovar utilizador:', error);
    res.status(500).json({ error: 'Erro ao aprovar utilizador' });
  }
});

router.put('/users/:id/rejeitar', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Utilizador rejeitado/removido' });
  } catch (error) {
    console.error('Erro ao rejeitar utilizador:', error);
    res.status(500).json({ error: 'Erro ao rejeitar utilizador' });
  }
});

router.delete('/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    if (user.perfil === 'admin') {
      return res.status(400).json({ error: 'Não é possível eliminar administradores' });
    }
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
});

router.get('/stats', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const totalUsers = await db.collection('usuarios').countDocuments();
    const pendingApprovals = await db.collection('usuarios').countDocuments({ aprovado: 0 });

    const usersByProfile = await db.collection('usuarios').aggregate([
      { $group: { _id: '$perfil', total: { $sum: 1 } } },
      { $project: { _id: 0, perfil: '$_id', total: 1 } }
    ]).toArray();

    const totalInstituicoes = await db.collection('instituicoes').countDocuments();
    const totalAlunos = await db.collection('alunos').countDocuments();
    const totalProfessores = await db.collection('professores').countDocuments();

    res.json({
      total_utilizadores: totalUsers,
      pendentes_aprovacao: pendingApprovals,
      por_perfil: usersByProfile,
      total_instituicoes: totalInstituicoes,
      total_alunos: totalAlunos,
      total_professores: totalProfessores
    });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
