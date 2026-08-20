const express = require('express');
const router = express.Router();
const { 
  getTurmas, 
  getTurmaById, 
  createTurma, 
  updateTurma, 
  deleteTurma 
} = require('../controllers/turmaController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getTurmas);
router.get('/:id', authenticateToken, getTurmaById);
router.post('/', authenticateToken, authorizeRole('admin', 'instituicao'), createTurma);
router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), updateTurma);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), deleteTurma);

module.exports = router;