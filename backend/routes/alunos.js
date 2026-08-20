const express = require('express');
const router = express.Router();
const {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno,
  getFilhosEncarregado,
  mudarEstadoAluno,
  emitirAdvertencia,
  abrirProcessoDisciplinar,
  encerrarProcessoDisciplinar
} = require('../controllers/alunoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const GESTAO = ['admin', 'instituicao'];

router.get('/filhos', authenticateToken, authorizeRole('encarregado'), getFilhosEncarregado);
router.get('/', authenticateToken, getAlunos);
router.get('/:id', authenticateToken, getAlunoById);
router.post('/', authenticateToken, authorizeRole(...GESTAO), createAluno);
router.put('/:id', authenticateToken, authorizeRole(...GESTAO), updateAluno);
router.delete('/:id', authenticateToken, authorizeRole(...GESTAO), deleteAluno);
router.put('/:id/estado', authenticateToken, authorizeRole(...GESTAO), mudarEstadoAluno);
router.post('/:id/advertencias', authenticateToken, authorizeRole(...GESTAO), emitirAdvertencia);
router.post('/:id/processos', authenticateToken, authorizeRole(...GESTAO), abrirProcessoDisciplinar);
router.put('/:id/processos/:procId', authenticateToken, authorizeRole(...GESTAO), encerrarProcessoDisciplinar);

module.exports = router;