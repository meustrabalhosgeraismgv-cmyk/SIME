const express = require('express');
const router = express.Router();
const { 
  getMatriculas, 
  createMatricula, 
  cancelMatricula 
} = require('../controllers/matriculaController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getMatriculas);
router.post('/', authenticateToken, authorizeRole('admin', 'diretor'), createMatricula);
router.put('/:id/cancelar', authenticateToken, authorizeRole('admin', 'diretor'), cancelMatricula);

module.exports = router;