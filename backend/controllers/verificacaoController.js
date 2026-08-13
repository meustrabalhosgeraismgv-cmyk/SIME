const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarEmail } = require('../config/email');
const { templateCodigo } = require('../config/emailTemplate');
const { enviarSMS } = require('./smsController');

const VALIDADE_CODIGO_MS = 10 * 60 * 1000;

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizarTelefone(telefone) {
  if (!telefone) return '';
  let s = String(telefone).replace(/[^\d]/g, '');
  if (s.length === 9) s = '244' + s;
  return '+' + s;
}

const solicitarVerificacao = async (req, res) => {
  try {
    const { email, telefone, tipo = 'cadastro' } = req.body;
    if (!email && !telefone) {
      return res.status(400).json({ error: 'Informe o email ou o telefone para receber o código' });
    }

    const db = getDB();
    const codigo = gerarCodigo();
    const expiraEm = new Date(Date.now() + VALIDADE_CODIGO_MS);

    const filtro = { tipo };
    if (email) filtro.email = email;
    if (telefone) filtro.telefone = normalizarTelefone(telefone);

    await db.collection('verificacoes').updateOne(
      filtro,
      { $set: { codigo, expira_em: expiraEm, usado: false, criado_em: new Date() } },
      { upsert: true }
    );

    if (email) {
      const r = await enviarEmail({
        to: email,
        subject: tipo === 'senha' ? 'Código de recuperação de senha — SIME' : 'Código de verificação — SIME',
        html: templateCodigo(codigo, tipo)
      });
      return res.json({
        message: `Código de verificação enviado para ${email}`,
        canal: 'email',
        estado: r.estado
      });
    }

    if (telefone) {
      const tel = normalizarTelefone(telefone);
      const r = await enviarSMS({
        telefone: tel,
        mensagem: `O seu código de verificação SIME é ${codigo}. Válido por 10 minutos.`,
        tipo: 'verificacao'
      });
      return res.json({
        message: `Código de verificação enviado por SMS para ${tel}`,
        canal: 'sms',
        estado: r.estado
      });
    }
  } catch (error) {
    console.error('Erro ao solicitar verificação:', error);
    res.status(500).json({ error: 'Erro ao enviar código de verificação' });
  }
};

const verificarCodigo = async (req, res) => {
  try {
    const { email, telefone, codigo, tipo = 'cadastro' } = req.body;
    if (!codigo) return res.status(400).json({ error: 'O código é obrigatório' });

    const db = getDB();
    const filtro = { tipo, codigo, usado: false, expira_em: { $gt: new Date() } };
    if (email) filtro.email = email;
    if (telefone) filtro.telefone = normalizarTelefone(telefone);

    const rec = await db.collection('verificacoes').findOne(filtro);
    if (!rec) return res.status(400).json({ error: 'Código inválido ou expirado' });

    await db.collection('verificacoes').updateOne(
      { _id: rec._id },
      { $set: { usado: true, verificado_em: new Date() } }
    );

    await db.collection('verificacoes_confirmadas').updateOne(
      { email: email || null, telefone: telefone ? normalizarTelefone(telefone) : null, tipo },
      { $set: { verificado: true, verificado_em: new Date() } },
      { upsert: true }
    );

    let reset_token = null;
    if (tipo === 'senha') {
      if (!email) return res.status(400).json({ error: 'Informe o email associado à conta' });
      const usuario = await db.collection('usuarios').findOne({ email });
      if (!usuario) return res.status(404).json({ error: 'Não existe utilizador com este email' });
      reset_token = crypto.randomBytes(32).toString('hex');
      await db.collection('usuarios').updateOne(
        { _id: usuario._id },
        { $set: { reset_token, reset_token_expira: new Date(Date.now() + 30 * 60 * 1000) } }
      );
    }

    res.json({ message: 'Código verificado com sucesso', verificado: true, reset_token });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ error: 'Erro ao verificar código' });
  }
};

const esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o email da sua conta' });

    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ email });
    if (!usuario) return res.status(404).json({ error: 'Não existe nenhum utilizador com este email' });

    const codigo = gerarCodigo();
    const expiraEm = new Date(Date.now() + VALIDADE_CODIGO_MS);

    await db.collection('verificacoes').updateOne(
      { email, tipo: 'senha' },
      { $set: { codigo, expira_em: expiraEm, usado: false, criado_em: new Date() } },
      { upsert: true }
    );

    const r = await enviarEmail({
      to: email,
      subject: 'Recuperação de palavra-passe — SIME',
      html: templateCodigo(codigo, 'senha')
    });

    res.json({ message: `Código de recuperação enviado para ${email}`, estado: r.estado });
  } catch (error) {
    console.error('Erro no pedido de recuperação:', error);
    res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
  }
};

const redefinirSenha = async (req, res) => {
  try {
    const { reset_token, nova_senha } = req.body;
    if (!reset_token || !nova_senha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    if (nova_senha.length < 6) {
      return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres' });
    }

    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({
      reset_token,
      reset_token_expira: { $gt: new Date() }
    });
    if (!usuario) return res.status(400).json({ error: 'Código expirado ou inválido. Solicite novamente.' });

    const hash = await bcrypt.hash(nova_senha, 10);
    await db.collection('usuarios').updateOne(
      { _id: usuario._id },
      { $set: { password: hash, reset_token: null, reset_token_expira: null } }
    );

    res.json({ message: 'Palavra-passe redefinida com sucesso. Pode iniciar sessão.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir palavra-passe' });
  }
};

module.exports = {
  solicitarVerificacao,
  verificarCodigo,
  esqueciSenha,
  redefinirSenha,
  normalizarTelefone,
  gerarCodigo
};