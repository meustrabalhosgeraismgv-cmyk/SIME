// Template de email profissional do SIME (Educa Mais+ Angola)
const LOGO_URL = 'https://sime-gov.vercel.app/Logotipo.png';
const COR_PRIMARIA = '#0D47A1';
const COR_ACCENT = '#2196F3';
const COR_BG = '#F4F6F9';
const COR_TEXTO = '#374151';
const COR_SUAVE = '#6B7280';
const URL_BASE = 'https://sime-gov.vercel.app';

function templateEmail({ titulo, mensagem, codigo = null, nota = null, botaoTexto = null, botaoUrl = null, rodape = null }) {
  const blocoCodigo = codigo
    ? `
      <div style="background:#E3F2FD;border:1px dashed #90CAF9;border-radius:12px;padding:22px;margin:24px 0;text-align:center;">
        <div style="font-size:11px;font-weight:700;color:${COR_PRIMARIA};letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Código de verificação</div>
        <div style="font-size:34px;font-weight:800;letter-spacing:12px;color:${COR_PRIMARIA};font-family:'Courier New',monospace;">${codigo}</div>
      </div>`
    : '';

  const blocoBotao = botaoTexto && botaoUrl
    ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${botaoUrl}" style="background:${COR_ACCENT};color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">${botaoTexto}</a>
      </div>`
    : '';

  const blocoNota = nota
    ? `<p style="color:${COR_SUAVE};font-size:13px;line-height:1.6;margin:16px 0 0;">${nota}</p>`
    : '';

  const blocoRodape = rodape
    ? `<p style="color:${COR_SUAVE};font-size:12px;line-height:1.6;margin:16px 0 0;">${rodape}</p>`
    : '';

  return `
  <div style="margin:0;padding:0;background:${COR_BG};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR_BG};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
            <!-- Cabeçalho -->
            <tr>
              <td style="background:${COR_PRIMARIA};padding:28px 32px;text-align:center;">
                <img src="${LOGO_URL}" alt="SIME - Educa Mais+ Angola" width="160" style="width:160px;height:auto;max-width:160px;border:0;display:inline-block;" />
              </td>
            </tr>
            <!-- Corpo -->
            <tr>
              <td style="padding:32px 32px 12px;">
                <h1 style="color:${COR_PRIMARIA};font-size:22px;font-weight:800;margin:0 0 8px;">${titulo}</h1>
                <p style="color:${COR_TEXTO};font-size:15px;line-height:1.6;margin:0;">${mensagem}</p>
                ${blocoCodigo}
                ${blocoBotao}
                ${blocoNota}
              </td>
            </tr>
            <!-- Rodapé -->
            <tr>
              <td style="background:${COR_BG};padding:20px 32px;text-align:center;">
                <div style="font-size:14px;font-weight:800;color:${COR_PRIMARIA};">Educa Mais<span style="color:${'#F44336'};">+</span> Angola</div>
                <div style="font-size:12px;color:${COR_SUAVE};margin-top:4px;">Sistema Integrado de Monitorização Escolar</div>
                <div style="font-size:11px;color:${COR_SUAVE};margin-top:12px;">© ${new Date().getFullYear()} SIME — República de Angola. Todos os direitos reservados.</div>
                <div style="font-size:11px;color:${COR_SUAVE};margin-top:4px;">Este é um email automático. Por favor, não responda a esta mensagem.</div>
                ${blocoRodape}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

function templateCodigo(codigo, tipo) {
  const titulo = tipo === 'senha' ? 'Recuperação de palavra-passe' : 'Verificação de conta';
  const mensagem = tipo === 'senha'
    ? 'Recebemos um pedido para recuperar a sua palavra-passe. Introduza o código abaixo para continuar.'
    : 'Estamos quase lá! Introduza o código abaixo para concluir o seu registo na plataforma SIME.';
  const nota = tipo === 'senha'
    ? 'Se não foi você que pediu a recuperação, ignore este email. A sua conta permanece segura.'
    : 'O código é válido por 10 minutos. Se não foi você, ignore este email.';
  return templateEmail({
    titulo,
    mensagem,
    codigo,
    nota,
    rodape: `Utilizador com dúvidas? Contacte o suporte em ${URL_BASE}`
  });
}

module.exports = { templateEmail, templateCodigo };