const express = require('express');
const router = express.Router();
const {
  getSms,
  getSmsStats,
  getDestinatarios,
  sendSms,
  sendSmsEmMassa
} = require('../controllers/smsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getSms);
router.get('/stats', authenticateToken, getSmsStats);
router.get('/destinatarios', authenticateToken, getDestinatarios);
router.post('/enviar', authenticateToken, sendSms);
router.post('/em-massa', authenticateToken, sendSmsEmMassa);

module.exports = router;
