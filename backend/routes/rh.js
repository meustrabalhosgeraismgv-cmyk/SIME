const express = require('express');
const router = express.Router();
const {
  getFuncionarios,
  getFuncionarioById,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  getRhStats,
  getAvaliacoes,
  createAvaliacao,
  updateAvaliacao,
  deleteAvaliacao
} = require('../controllers/rhController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, getRhStats);
router.get('/avaliacoes', authenticateToken, getAvaliacoes);
router.post('/avaliacoes', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor'), createAvaliacao);
router.put('/avaliacoes/:id', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor'), updateAvaliacao);
router.delete('/avaliacoes/:id', authenticateToken, authorizeRole('admin'), deleteAvaliacao);
router.get('/', authenticateToken, getFuncionarios);
router.get('/:id', authenticateToken, getFuncionarioById);
router.post('/', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor'), createFuncionario);
router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor'), updateFuncionario);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteFuncionario);

module.exports = router;
