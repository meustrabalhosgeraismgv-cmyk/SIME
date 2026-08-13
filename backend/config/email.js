// Configuração de email via API do Brevo (abordagem igual ao SIREXA)
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'venanciomartinse@gmail.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'SIME - Educa Mais+ Angola';

/**
 * Envia um email transacional através da API do Brevo.
 * @param {object} opcoes { to, subject, html, text }
 * @returns {Promise<{estado: string}>}
 */
async function enviarEmail({ to, subject, html, text }) {
  if (!BREVO_API_KEY) {
    console.warn('[EMAIL] Chave API Brevo não configurada. Email NÃO enviado para', to, '-', subject);
    return { estado: 'nao_configurado' };
  }

  if (!to) {
    return { estado: 'sem_destinatario' };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]+>/g, ' ')
      })
    });

    if (!response.ok) {
      const detalhe = await response.text();
      console.error('[EMAIL] Erro Brevo:', response.status, detalhe);
      return { estado: 'falhou', status: response.status, detalhe };
    }

    return { estado: 'enviado' };
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar email:', error.message);
    return { estado: 'erro', detalhe: error.message };
  }
}

module.exports = { enviarEmail, BREVO_API_KEY };