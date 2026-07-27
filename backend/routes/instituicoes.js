const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const {
  getInstituicoes,
  getInstituicaoById,
  createInstituicao,
  updateInstituicao,
  deleteInstituicao,
  getEstatisticasInstituicao
} = require('../controllers/instituicaoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/stats', async (req, res) => {
  try {
    const db = getDB();
    const total = await db.collection('instituicoes').countDocuments();
    const alunos = await db.collection('alunos').countDocuments();
    const professores = await db.collection('professores').countDocuments();

    const vagasAgg = await db.collection('instituicoes').aggregate([
      { $group: { _id: null, total: { $sum: '$vagas_disponiveis' } } }
    ]).toArray();
    const vagas = vagasAgg[0]?.total || 0;

    res.json({ total, alunos, professores, vagas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

router.get('/', getInstituicoes);
router.get('/:id', getInstituicaoById);
router.get('/:id/estatisticas', getEstatisticasInstituicao);
router.post('/', authenticateToken, authorizeRole('admin'), createInstituicao);
router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), updateInstituicao);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteInstituicao);

module.exports = router;
