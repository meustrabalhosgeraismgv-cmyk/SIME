const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const { enviarSMS } = require('../controllers/smsController');

const CODIGOS = [
  { codigo: '*100#', descricao: 'Menu principal do SIME' },
  { codigo: '*100*1*BI#', descricao: 'Consultar estado das solicitações de vaga do aluno (BI)' },
  { codigo: '*100*2*BI#', descricao: 'Consultar matrícula do aluno (BI)' },
  { codigo: '*100*3#', descricao: 'Listar escolas públicas disponíveis' },
  { codigo: '*100*4*Nome*BI*Telefone#', descricao: 'Registo rápido de encarregado de educação' },
  { codigo: '*100*5#', descricao: 'Ajuda — lista de códigos rápidos' },
];

function gerarPassword() {
  return Math.random().toString(36).slice(2, 8);
}

function normalizarTelefone(t) {
  if (!t) return '';
  return String(t).replace(/\s+/g, '');
}

async function registarSessao(db, { telefone, comando, resposta, sucesso }) {
  await db.collection('ussd_sessoes').insertOne({
    telefone,
    comando,
    resposta,
    sucesso,
    created_at: new Date()
  });
}

async function responder(telefone, comando, resposta) {
  const db = getDB();
  await registarSessao(db, { telefone, comando, resposta, sucesso: true });
  try {
    await enviarSMS({ telefone, mensagem: resposta, tipo: 'ussd', destinatario_tipo: 'telemovel_analogico' });
  } catch (e) {
    console.error('[USSD] Falha ao enviar resposta por SMS:', e.message);
  }
}

async function executarComando(telefone, comando) {
  const db = getDB();
  const partes = comando.replace(/^#|#$/g, '').split('*').filter(Boolean);
  const base = partes[0] || '';
  const acao = partes[1] || '';

  if (base !== '100') {
    return 'Código inválido. Para usar o SIME por telemóvel, disque *100# e siga as instruções.';
  }

  if (!acao || acao === '') {
    const menu = [
      'SIME — Códigos Rápidos',
      '1. Consultar vaga (*100*1*BI#)',
      '2. Consultar matrícula (*100*2*BI#)',
      '3. Listar escolas (*100*3#)',
      '4. Registo de encarregado (*100*4*Nome*BI*Telefone#)',
      '5. Ajuda (*100*5#)',
      'Grátis e sem internet.'
    ].join('\n');
    return menu;
  }

  if (acao === '5') {
    return ['SIME — Ajuda', ...CODIGOS.map(c => `${c.codigo} — ${c.descricao}`), 'Sem custo, sem internet. Envie o código para o número curto 100.'].join('\n');
  }

  if (acao === '3') {
    const escolas = await db.collection('instituicoes')
      .find({ status: 'ativa', tipo: { $in: ['ensino_primario', 'ensino_medio', 'ensino_secundario'] } })
      .project({ nome: 1, municipio_nome: 1, vagas_disponiveis: 1 })
      .sort({ nome: 1 })
      .limit(8)
      .toArray();
    if (escolas.length === 0) return 'Escolas públicas disponíveis: nenhuma encontrada.';
    const linhas = escolas.map((e, i) => `${i + 1}. ${e.nome} (${e.municipio_nome || ''}) — ${e.vagas_disponiveis || 0} vagas`);
    return ['Escolas públicas (Huambo):', ...linhas, 'Para solicitar vaga, aceda ao SIME ou *100*1*BI#.'].join('\n');
  }

  if (acao === '1') {
    const bi = partes[2] || '';
    if (!bi) return 'Para consultar a vaga, envie: *100*1*BI# (ex.: *100*1*003456789LA004#)';
    const encarregado = await db.collection('encarregados').findOne({ $or: [{ bi }, { telefone: normalizarTelefone(telefone) }] });
    if (!encarregado) return 'Encarregado não encontrado. Registre-se: *100*4*Nome*BI*Telefone#';
    const solicitacoes = await db.collection('solicitacoes')
      .find({ encarregado_id: encarregado._id })
      .sort({ created_at: -1 })
      .limit(3)
      .toArray();
    if (solicitacoes.length === 0) return 'Não há solicitações de vaga registadas para este BI.';
    const estados = { pendente: 'Em análise', aceite: 'Aceite', agendado: 'Agendado', rejeitada: 'Recusada', inscrito: 'Inscrito' };
    const linhas = solicitacoes.map((s, i) => `${i + 1}. Aluno: ${s.aluno_nome}\n   Estado: ${estados[s.estado] || s.estado}`);
    return ['Estado das solicitações:', ...linhas, 'Grátis. Responda *100# para o menu.'].join('\n');
  }

  if (acao === '2') {
    const bi = partes[2] || '';
    if (!bi) return 'Para consultar a matrícula, envie: *100*2*BI#';
    const encarregado = await db.collection('encarregados').findOne({ $or: [{ bi }, { telefone: normalizarTelefone(telefone) }] });
    if (!encarregado) return 'Encarregado não encontrado. Registre-se: *100*4*Nome*BI*Telefone#';
    const aluno = await db.collection('alunos').findOne({ encarregado_id: encarregado._id, $or: [{ bi }] });
    const matricula = aluno ? await db.collection('matriculas').findOne({ aluno_id: aluno._id, estado: 'ativa' }) : null;
    if (!matricula) return 'Não foi encontrada uma matrícula ativa para este BI.';
    const instituicao = await db.collection('instituicoes').findOne({ _id: matricula.instituicao_id });
    return [
      'Matrícula ativa:',
      `Aluno: ${aluno.nome_completo}`,
      `Nº de estudante: ${aluno.numero_estudante}`,
      `Instituição: ${instituicao?.nome || '—'}`,
      `Ano lectivo: ${matricula.ano_letivo}`
    ].join('\n');
  }

  if (acao === '4') {
    const nome = partes[2] || '';
    const bi = partes[3] || '';
    const tel = partes[4] ? normalizarTelefone(partes[4]) : normalizarTelefone(telefone);
    if (!nome || !bi) return 'Registo incompleto. Envie: *100*4*Nome*BI*Telefone#';
    const existente = await db.collection('encarregados').findOne({ $or: [{ bi }, { telefone: tel }] });
    if (existente) return 'Este BI ou telefone já está registado. Use *100*1*BI# para consultar o estado da vaga.';
    if (!tel || tel.length < 9) return 'Telefone inválido. Envie: *100*4*Nome*BI*Telefone#';

    const username = bi;
    const senha = gerarPassword();
    const hashed = await bcrypt.hash(senha, 10);

    const encResult = await db.collection('encarregados').insertOne({
      nome_completo: nome,
      bi,
      telefone: tel,
      created_at: new Date()
    });

    await db.collection('usuarios').insertOne({
      username,
      password: hashed,
      perfil: 'encarregado',
      nome,
      email: null,
      telefone: tel,
      is_gestor: false,
      entidade_id: encResult.insertedId.toString(),
      entidade_tipo: 'encarregado',
      aprovado: true,
      foto: null,
      created_at: new Date()
    });

    const resposta = [
      'Registo concluído com sucesso!',
      `Utilizador: ${username}`,
      `Senha provisória: ${senha}`,
      'Aceda ao SIME para solicitar vagas.',
      'Este SMS é gratuito.'
    ].join('\n');
    return resposta;
  }

  return 'Opção inválida. Disque *100# para ver o menu.';
}

router.post('/entrada', async (req, res) => {
  try {
    const { telefone, mensagem } = req.body;
    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem (código USSD) são obrigatórios' });
    }
    const comando = String(mensagem).trim();
    const resposta = await executarComando(normalizarTelefone(telefone), comando);
    await responder(telefone, comando, resposta);
    res.json({ telefone, comando, resposta, codigos: CODIGOS });
  } catch (error) {
    console.error('Erro no USSD:', error);
    res.status(500).json({ error: 'Erro ao processar o código USSD' });
  }
});

router.get('/codigos', async (req, res) => {
  res.json({ data: CODIGOS });
});

router.get('/registos', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const registos = await db.collection('ussd_sessoes')
      .find()
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    res.json({ data: registos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar registos USSD' });
  }
});

router.post('/registar-encarregado', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const { nome_completo, bi, telefone } = req.body;
    if (!nome_completo || !bi || !telefone) {
      return res.status(400).json({ error: 'Nome, BI e telefone são obrigatórios' });
    }
    const db = getDB();
    const tel = normalizarTelefone(telefone);

    const existente = await db.collection('encarregados').findOne({ $or: [{ bi }, { telefone: tel }] });
    if (existente) return res.status(400).json({ error: 'Já existe um encarregado com este BI ou telefone' });

    const username = bi;
    const senha = gerarPassword();
    const hashed = await bcrypt.hash(senha, 10);

    const encResult = await db.collection('encarregados').insertOne({
      nome_completo,
      bi,
      telefone: tel,
      created_at: new Date()
    });

    await db.collection('usuarios').insertOne({
      username,
      password: hashed,
      perfil: 'encarregado',
      nome: nome_completo,
      email: null,
      telefone: tel,
      is_gestor: false,
      entidade_id: encResult.insertedId.toString(),
      entidade_tipo: 'encarregado',
      aprovado: true,
      foto: null,
      created_at: new Date()
    });

    const mensagem = [
      'SIME — Conta criada pelo administrador',
      `Utilizador: ${username}`,
      `Senha provisória: ${senha}`,
      'Aceda ao sistema para solicitar vagas.'
    ].join('\n');

    let sms = null;
    try {
      sms = await enviarSMS({ telefone: tel, mensagem, tipo: 'ussd', criado_por: req.user.id });
    } catch (e) {
      console.error('[USSD] Falha ao enviar SMS de boas-vindas:', e.message);
    }

    res.status(201).json({
      message: 'Encarregado registado com sucesso',
      encarregado_id: encResult.insertedId.toString(),
      username,
      senha_provisoria: senha,
      sms
    });
  } catch (error) {
    console.error('Erro ao registar encarregado:', error);
    res.status(500).json({ error: 'Erro ao registar encarregado' });
  }
});

module.exports = { router, CODIGOS };