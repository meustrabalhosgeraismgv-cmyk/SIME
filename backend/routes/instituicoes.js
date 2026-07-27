const express = require('express');
const router = express.Router();
const { 
  getInstituicoes, 
  getInstituicaoById, 
  createInstituicao, 
  updateInstituicao, 
  deleteInstituicao,
  getEstatisticasInstituicao
} = require('../controllers/instituicaoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const db = require('../config/database');

router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as total FROM instituicoes').get().total;
    const alunos = db.prepare('SELECT COUNT(*) as total FROM alunos').get().total;
    const professores = db.prepare('SELECT COUNT(*) as total FROM professores').get().total;
    const vagas = db.prepare('SELECT COALESCE(SUM(vagas_disponiveis), 0) as total FROM instituicoes').get().total;
    
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