const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const controller = require('../controllers/configuracaoGlobalController');

router.get('/', controller.get);

router.put('/', authenticateToken, controller.salvar);

module.exports = router;