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
router.post('/', authenticateToken, authorizeRole('admin', 'diretor'), createTurma);
router.put('/:id', authenticateToken, authorizeRole('admin', 'diretor'), updateTurma);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'diretor'), deleteTurma);

module.exports = router;