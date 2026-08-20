const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getEstatisticasProvincia, 
  getRelatorioOcupacao 
} = require('../controllers/dashboardController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/provincia', authenticateToken, authorizeRole('admin'), getEstatisticasProvincia);
router.get('/ocupacao', authenticateToken, getRelatorioOcupacao);

module.exports = router;