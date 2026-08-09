const express = require('express');
const router = express.Router();
const {
  getDenuncias,
  getDenunciaById,
  createDenuncia,
  updateDenuncia,
  deleteDenuncia,
  getDenunciasStats
} = require('../controllers/denunciaController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, getDenunciasStats);
router.get('/', authenticateToken, getDenuncias);
router.get('/:id', authenticateToken, getDenunciaById);
router.post('/', createDenuncia);
router.put('/:id', authenticateToken, updateDenuncia);
router.delete('/:id', authenticateToken, deleteDenuncia);

module.exports = router;
