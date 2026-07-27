const express = require('express');
const router = express.Router();
const { 
  getAlunos, 
  getAlunoById, 
  createAluno, 
  updateAluno, 
  deleteAluno 
} = require('../controllers/alunoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getAlunos);
router.get('/:id', authenticateToken, getAlunoById);
router.post('/', authenticateToken, authorizeRole('admin', 'diretor'), createAluno);
router.put('/:id', authenticateToken, authorizeRole('admin', 'diretor'), updateAluno);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'diretor'), deleteAluno);

module.exports = router;