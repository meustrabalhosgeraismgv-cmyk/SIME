const express = require('express');
const router = express.Router();
const { 
  getProfessores, 
  getProfessorById, 
  createProfessor, 
  updateProfessor, 
  deleteProfessor 
} = require('../controllers/professorController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getProfessores);
router.get('/:id', authenticateToken, getProfessorById);
router.post('/', authenticateToken, authorizeRole('admin', 'diretor', 'instituicao'), createProfessor);
router.put('/:id', authenticateToken, authorizeRole('admin', 'diretor', 'instituicao'), updateProfessor);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'diretor', 'instituicao'), deleteProfessor);

module.exports = router;