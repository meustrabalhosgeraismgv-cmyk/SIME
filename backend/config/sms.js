require('dotenv').config();

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';
const BREVO_SMS_KEY = process.env.SMS_API_KEY || process.env.BREVO_API_KEY || '';

const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || '',   // 'brevo' para envio real; vazio = simulado
  apiUrl: process.env.SMS_API_URL || BREVO_SMS_URL,
  apiKey: BREVO_SMS_KEY,
  sender: process.env.SMS_SENDER || 'SIME',
  phone: process.env.SMS_PHONE || '',
  enabled: Boolean(process.env.SMS_PROVIDER),
};

module.exports = { SMS_CONFIG };