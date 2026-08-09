const express = require('express');
const router = express.Router();
const {
  getClassificacoes,
  getHistoricoAluno,
  createClassificacao,
  updateClassificacao,
  deleteClassificacao
} = require('../controllers/classificacaoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getClassificacoes);
router.get('/historico/:id', authenticateToken, getHistoricoAluno);
router.post('/', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor', 'professor'), createClassificacao);
router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao', 'diretor', 'professor'), updateClassificacao);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteClassificacao);

module.exports = router;
