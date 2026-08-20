const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const controller = require('../controllers/pagamentoController');

router.get('/gestor', authenticateToken, controller.getGestor);
router.get('/encarregado', authenticateToken, controller.getEncarregado);

router.post('/', authenticateToken, controller.criar);

router.post('/upload-comprovativo', authenticateToken, upload.comprovativos.single('ficheiro'), controller.uploadComprovativo);

router.post('/:id/pagar-plataforma', authenticateToken, controller.pagarPlataforma);

router.post('/gerar-mensalidades', authenticateToken, authorizeRole('admin', 'instituicao'), controller.gerarMensalidades);

router.post('/avisar', authenticateToken, authorizeRole('admin', 'instituicao'), controller.avisar);

router.put('/:id/confirmar', authenticateToken, authorizeRole('admin', 'instituicao'), controller.confirmar);

router.put('/:id/rejeitar', authenticateToken, authorizeRole('admin', 'instituicao'), controller.rejeitar);

module.exports = router;