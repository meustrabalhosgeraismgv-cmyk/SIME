require('dotenv').config();

const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || '',
  apiUrl: process.env.SMS_API_URL || '',
  apiKey: process.env.SMS_API_KEY || '',
  sender: process.env.SMS_SENDER || 'SIME',
  phone: process.env.SMS_PHONE || '',
  enabled: Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_URL),
};

module.exports = { SMS_CONFIG };
