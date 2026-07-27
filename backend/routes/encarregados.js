const express = require('express');
const router = express.Router();
const { 
  getEncarregados, 
  getEncarregadoById, 
  createEncarregado, 
  updateEncarregado, 
  deleteEncarregado 
} = require('../controllers/encarregadoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, getEncarregados);
router.get('/:id', authenticateToken, getEncarregadoById);
router.post('/', authenticateToken, authorizeRole('admin', 'diretor'), createEncarregado);
router.put('/:id', authenticateToken, authorizeRole('admin', 'diretor'), updateEncarregado);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'diretor'), deleteEncarregado);

module.exports = router;