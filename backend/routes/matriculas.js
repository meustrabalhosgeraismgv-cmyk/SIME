const express = require('express');
const router = express.Router();
const { 
  getMatriculas, 
  createMatricula, 
  cancelMatricula,
  getMatriculasEncarregado,
  createMatriculaEncarregado 
} = require('../controllers/matriculaController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getMatriculas);
router.get('/encarregado', authenticateToken, getMatriculasEncarregado);
router.post('/encarregado', authenticateToken, createMatriculaEncarregado);
router.post('/', authenticateToken, authorizeRole('admin', 'diretor'), createMatricula);
router.put('/:id/cancelar', authenticateToken, authorizeRole('admin', 'diretor'), cancelMatricula);

module.exports = router;