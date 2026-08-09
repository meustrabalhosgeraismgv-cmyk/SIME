const express = require('express');
const router = express.Router();
const { getRelatorioSintese } = require('../controllers/relatorioSinteseController');
const { authenticateToken } = require('../middleware/auth');

router.get('/sintese', authenticateToken, getRelatorioSintese);

module.exports = router;
