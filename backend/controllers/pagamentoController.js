const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { matchId } = require('../utils/filters');
const { getEncarregadoId } = require('../utils/encarregadoUtil');
const configGlobal = require('./configuracaoGlobalController');
const configFinanceira = require('./configuracaoFinanceiraController');

const TIPOS_TAXA = {
  inscricao: 'Emolumento de Inscrição',
  matricula: 'Emolumento de Matrícula',
  mensalidade: 'Mensalidade',
  comparticipacao: 'Comparticipação',
  uniforme: 'Uniforme Escolar',
  transporte: 'Transporte',
  atividade: 'Atividade Extracurricular',
  quota: 'Quota',
  outro: 'Outro'
};

function gerarReferencia() {
  return `REF-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
}

function gerarNumeroProcesso(db) {
  const ano = new Date().getFullYear();
  return `PROC-${ano}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function toPagamento(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc._id ? doc._id.toString() : null,
    instituicao_id: doc.instituicao_id ? doc.instituicao_id.toString() : null,
    encarregado_id: doc.encarregado_id ? doc.encarregado_id.toString() : null,
    solicitacao_id: doc.solicitacao_id ? doc.solicitacao_id.toString() : null,
    matricula_id: doc.matricula_id ? doc.matricula_id.toString() : null,
    aluno_id: doc.aluno_id ? doc.aluno_id.toString() : null
  };
}

const getGestor = async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = matchId(usuario?.entidade_id);
    const { estado = '', tipo_taxa = '' } = req.query;

    const matchStage = { instituicao_id: instituicaoId };
    if (estado) matchStage.estado = estado;
    if (tipo_taxa) matchStage.tipo_taxa = tipo_taxa;

    const pagamentos = await db.collection('pagamentos').aggregate([
      { $match: matchStage },
      { $lookup: { from: 'encarregados', localField: 'encarregado_id', foreignField: '_id', as: 'encarregado' } },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'alunos', localField: 'aluno_id', foreignField: '_id', as: 'aluno' } },
      { $unwind: { path: '$aluno', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'solicitacoes', localField: 'solicitacao_id', foreignField: '_id', as: 'solicitacao' } },
      { $unwind: { path: '$solicitacao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'turmas', localField: 'solicitacao.turma_id', foreignField: '_id', as: 'turma' } },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        id: { $toString: '$_id' },
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        aluno_nome: { $ifNull: ['$aluno.nome_completo', '$solicitacao.aluno_nome'] },
        turma_nome: '$turma.nome',
        tipo_taxa_nome: '$$REMOVE'
      } },
      { $project: { encarregado: 0, aluno: 0, solicitacao: 0, turma: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: pagamentos.map((p) => ({ ...p, tipo_taxa_nome: TIPOS_TAXA[p.tipo_taxa] || p.tipo_taxa })) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
};

const getEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const encarregadoId = await getEncarregadoId(req);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const pagamentos = await db.collection('pagamentos').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'solicitacoes', localField: 'solicitacao_id', foreignField: '_id', as: 'solicitacao' } },
      { $unwind: { path: '$solicitacao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'alunos', localField: 'aluno_id', foreignField: '_id', as: 'aluno' } },
      { $unwind: { path: '$aluno', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        id: { $toString: '$_id' },
        instituicao_nome: '$instituicao.nome',
        aluno_nome: { $ifNull: ['$aluno.nome_completo', '$solicitacao.aluno_nome'] }
      } },
      { $project: { instituicao: 0, solicitacao: 0, aluno: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: pagamentos.map((p) => ({ ...p, tipo_taxa_nome: TIPOS_TAXA[p.tipo_taxa] || p.tipo_taxa })) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
};

const criar = async (req, res) => {
  try {
    const db = getDB();
    const encarregadoId = await getEncarregadoId(req);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const { instituicao_id, tipo_taxa, valor, descricao, solicitacao_id, matricula_id, aluno_id, mes } = req.body;
    if (!instituicao_id || !tipo_taxa) return res.status(400).json({ error: 'instituicao_id e tipo_taxa são obrigatórios' });

    const plataformaAtiva = await configGlobal.estadoPagamentoPlataforma();
    const valorFinal = Math.max(0, parseFloat(valor) || 0);

    const result = await db.collection('pagamentos').insertOne({
      instituicao_id: new ObjectId(instituicao_id),
      encarregado_id: encarregadoId,
      solicitacao_id: solicitacao_id ? new ObjectId(solicitacao_id) : null,
      matricula_id: matricula_id ? new ObjectId(matricula_id) : null,
      aluno_id: aluno_id ? new ObjectId(aluno_id) : null,
      tipo_taxa,
      descricao: descricao || TIPOS_TAXA[tipo_taxa] || tipo_taxa,
      valor: valorFinal,
      mes: mes || null,
      referencia: gerarReferencia(),
      forma_pagamento: plataformaAtiva ? 'plataforma' : 'comprovativo',
      estado: 'pendente',
      created_at: new Date()
    });

    res.status(201).json({
      data: toPagamento(await db.collection('pagamentos').findOne({ _id: result.insertedId })),
      plataforma_ativada: plataformaAtiva,
      message: plataformaAtiva
        ? 'Referência de pagamento gerada pela plataforma'
        : 'Pagamento registado. Carregue o comprovativo para concluir.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registar pagamento' });
  }
};

const uploadComprovativo = async (req, res) => {
  try {
    const db = getDB();
    const encarregadoId = await getEncarregadoId(req);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id do pagamento é obrigatório' });
    if (!req.file) return res.status(400).json({ error: 'Nenhum comprovativo enviado' });

    const pagamento = await db.collection('pagamentos').findOne({ _id: new ObjectId(id), encarregado_id: encarregadoId });
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });

    const url = req.file.path;
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(id) },
      { $set: { comprovativo_url: url, comprovativo_nome: req.file.originalname, estado: 'pago', data_comprovativo: new Date() } }
    );

    const atual = await db.collection('pagamentos').findOne({ _id: new ObjectId(id) });
    res.json({ data: toPagamento(atual), message: 'Comprovativo carregado. A instituição irá confirmar o pagamento.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar comprovativo' });
  }
};

const pagarPlataforma = async (req, res) => {
  try {
    const db = getDB();
    const encarregadoId = await getEncarregadoId(req);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const plataformaAtiva = await configGlobal.estadoPagamentoPlataforma();
    if (!plataformaAtiva) {
      return res.status(400).json({ error: 'Pagamento pela plataforma ainda não está ativo nesta fase. Carregue o comprovativo.' });
    }

    const pagamento = await db.collection('pagamentos').findOne({ _id: new ObjectId(req.params.id), encarregado_id: encarregadoId });
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });

    const recibo = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'pago', forma_pagamento: 'plataforma', data_pagamento: new Date(), recibo_numero: recibo, confirmado_por: 'plataforma', confirmado_em: new Date() } }
    );

    const atual = await db.collection('pagamentos').findOne({ _id: new ObjectId(req.params.id) });
    res.json({ data: toPagamento(atual), recibo_numero: recibo, message: 'Pagamento efetuado com sucesso pela plataforma' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao efetuar pagamento pela plataforma' });
  }
};

const confirmar = async (req, res) => {
  try {
    const db = getDB();
    const pagamento = await db.collection('pagamentos').findOne({ _id: new ObjectId(req.params.id) });
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });

    const recibo = pagamento.recibo_numero || `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'confirmado', data_pagamento: pagamento.data_pagamento || new Date(), recibo_numero: recibo, confirmado_por: new ObjectId(req.user.id), confirmado_em: new Date() } }
    );

    const io = req.app.get('io');
    if (io && pagamento.encarregado_id) {
      io.to('entidade:' + pagamento.encarregado_id.toString()).emit('pagamento:confirmado', toPagamento(pagamento));
    }

    res.json({ message: 'Pagamento confirmado', recibo_numero: recibo });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
};

const rejeitar = async (req, res) => {
  try {
    const db = getDB();
    const { observacoes = '' } = req.body;
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'pendente', observacoes: String(observacoes).slice(0, 300) } }
    );
    res.json({ message: 'Comprovativo recusado. O pagamento voltou a pendente.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recusar comprovativo' });
  }
};

async function gerarMensalidadesParaMatricula(matricula, financeiro) {
  const db = getDB();
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const meses = [];
  for (let m = 9; m <= 12; m++) if (m >= mesAtual) meses.push({ mes: m, ano: anoAtual });
  for (let m = 1; m <= 6; m++) meses.push({ mes: m, ano: anoAtual + 1 });

  let criados = 0;
  for (const { mes, ano } of meses) {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;
    const existente = await db.collection('pagamentos').findOne({ matricula_id: matricula._id, tipo_taxa: 'mensalidade', mes: chave });
    if (existente) continue;

    const dataLimite = new Date(ano, mes - 1, financeiro.mensalidade.dia_limite || 10);
    await db.collection('pagamentos').insertOne({
      instituicao_id: matricula.instituicao_id,
      encarregado_id: matricula.encarregado_id,
      matricula_id: matricula._id,
      aluno_id: matricula.aluno_id,
      solicitacao_id: matricula.solicitacao_id || null,
      tipo_taxa: 'mensalidade',
      descricao: `Mensalidade ${chave}`,
      valor: financeiro.mensalidade.valor,
      mes: chave,
      multa_atraso: financeiro.mensalidade.multa_atraso || 0,
      referencia: gerarReferencia(),
      forma_pagamento: (await configGlobal.estadoPagamentoPlataforma()) ? 'plataforma' : 'comprovativo',
      estado: 'pendente',
      data_limite: dataLimite,
      created_at: new Date()
    });
    criados++;
  }
  return criados;
}

const gerarMensalidades = async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = matchId(usuario?.entidade_id);
    const { matricula_id } = req.body;
    if (!matricula_id) return res.status(400).json({ error: 'matricula_id é obrigatório' });

    const matricula = await db.collection('matriculas').findOne({ _id: new ObjectId(matricula_id) });
    if (!matricula) return res.status(404).json({ error: 'Matrícula não encontrada' });

    const financeiro = await configFinanceira.getDocumento(matricula.instituicao_id);
    if (!financeiro.mensalidade || !financeiro.mensalidade.ativo || !financeiro.mensalidade.valor) {
      return res.status(400).json({ error: 'Mensalidade não configurada/ativa para esta instituição' });
    }

    const criados = await gerarMensalidadesParaMatricula(matricula, financeiro);

    res.json({ message: `${criados} mensalidade(s) gerada(s) para o ano letivo`, criados });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar mensalidades' });
  }
};

const gerarMensalidadesInterno = async (matriculaId, financeiro) => {
  const db = getDB();
  const matricula = await db.collection('matriculas').findOne({ _id: new ObjectId(matriculaId) });
  if (!matricula || !financeiro?.mensalidade?.ativo) return 0;
  return gerarMensalidadesParaMatricula(matricula, financeiro);
};

const avisar = async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = matchId(usuario?.entidade_id);

    const { tipo_taxa, titulo, conteudo, valor, matricula_id, aluno_id, encarregado_id, mes } = req.body;
    if (!titulo) return res.status(400).json({ error: 'titulo é obrigatório' });
    if (!encarregado_id) return res.status(400).json({ error: 'encarregado_id é obrigatório' });

    const instituicao = await db.collection('instituicoes').findOne({ _id: instituicaoId });

    let pagamentoId = null;
    const valorNum = Math.max(0, parseFloat(valor) || 0);
    if (valorNum > 0 && matricula_id) {
      const pagamentoResult = await db.collection('pagamentos').insertOne({
        instituicao_id: instituicaoId,
        encarregado_id: new ObjectId(encarregado_id),
        matricula_id: new ObjectId(matricula_id),
        aluno_id: aluno_id ? new ObjectId(aluno_id) : null,
        tipo_taxa: tipo_taxa || 'outro',
        descricao: TIPOS_TAXA[tipo_taxa] || titulo,
        valor: valorNum,
        mes: mes || null,
        referencia: gerarReferencia(),
        forma_pagamento: (await configGlobal.estadoPagamentoPlataforma()) ? 'plataforma' : 'comprovativo',
        estado: 'pendente',
        created_at: new Date()
      });
      pagamentoId = pagamentoResult.insertedId;
    }

    const comunicado = {
      titulo,
      conteudo: conteudo || `Notificação de pagamento de ${TIPOS_TAXA[tipo_taxa] || 'taxa'} no valor de ${valorNum.toLocaleString('pt-AO')} Kz. Efetue o pagamento no portal para manter o processo em dia.`,
      tipo: 'aviso_pagamento',
      instituicao_id: instituicaoId,
      destinatario_id: new ObjectId(encarregado_id),
      pagamento_id: pagamentoId ? pagamentoId : null,
      valor: valorNum,
      publicado: 1,
      destaque: 0,
      autor_id: new ObjectId(req.user.id),
      autor_nome: usuario?.nome || usuario?.username || 'Instituição',
      created_at: new Date()
    };
    const comResult = await db.collection('comunicados').insertOne(comunicado);

    const io = req.app.get('io');
    if (io) {
      io.to('entidade:' + encarregado_id.toString()).emit('aviso:novo', { comunicado_id: comResult.insertedId.toString(), titulo });
    }

    res.status(201).json({
      message: `Aviso enviado ao encarregado${pagamentoId ? ' e pagamento registado' : ''}`,
      comunicado_id: comResult.insertedId.toString(),
      pagamento_id: pagamentoId ? pagamentoId.toString() : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar aviso' });
  }
};

async function garantirTransacoesMatricula(solicitacao) {
  const db = getDB();
  const instituicaoId = solicitacao.instituicao_id;
  const financeiro = await configFinanceira.getDocumento(instituicaoId);

  const criadas = [];
  if (financeiro.emolumento_matricula && financeiro.emolumento_matricula.ativo && financeiro.emolumento_matricula.valor > 0) {
    const existente = await db.collection('pagamentos').findOne({ solicitacao_id: solicitacao._id, tipo_taxa: 'matricula' });
    if (!existente) {
      const r = await db.collection('pagamentos').insertOne({
        instituicao_id: instituicaoId,
        encarregado_id: solicitacao.encarregado_id,
        solicitacao_id: solicitacao._id,
        tipo_taxa: 'matricula',
        descricao: 'Emolumento de Matrícula',
        valor: financeiro.emolumento_matricula.valor,
        referencia: gerarReferencia(),
        forma_pagamento: (await configGlobal.estadoPagamentoPlataforma()) ? 'plataforma' : 'comprovativo',
        estado: 'pendente',
        created_at: new Date()
      });
      criadas.push(r.insertedId);
    }
  }

  if (financeiro.primeira_mensalidade && financeiro.mensalidade && financeiro.mensalidade.ativo && financeiro.mensalidade.valor > 0) {
    const existente = await db.collection('pagamentos').findOne({ solicitacao_id: solicitacao._id, tipo_taxa: 'mensalidade', mes: '1a' });
    if (!existente) {
      const r = await db.collection('pagamentos').insertOne({
        instituicao_id: instituicaoId,
        encarregado_id: solicitacao.encarregado_id,
        solicitacao_id: solicitacao._id,
        tipo_taxa: 'mensalidade',
        descricao: 'Primeira Mensalidade',
        valor: financeiro.mensalidade.valor,
        mes: '1a',
        referencia: gerarReferencia(),
        forma_pagamento: (await configGlobal.estadoPagamentoPlataforma()) ? 'plataforma' : 'comprovativo',
        estado: 'pendente',
        created_at: new Date()
      });
      criadas.push(r.insertedId);
    }
  }

  return criadas;
}

async function verificarPagamentosMatricula(solicitacao) {
  const db = getDB();
  const instituicaoId = solicitacao.instituicao_id;
  const financeiro = await configFinanceira.getDocumento(instituicaoId);

  const pendentes = [];

  if (financeiro.emolumento_matricula && financeiro.emolumento_matricula.ativo && financeiro.emolumento_matricula.valor > 0) {
    const p = await db.collection('pagamentos').findOne({ solicitacao_id: solicitacao._id, tipo_taxa: 'matricula' });
    if (!p || !['pago', 'confirmado'].includes(p.estado)) {
      pendentes.push({ tipo_taxa: 'matricula', descricao: 'Emolumento de Matrícula', valor: financeiro.emolumento_matricula.valor });
    }
  }

  if (financeiro.primeira_mensalidade && financeiro.mensalidade && financeiro.mensalidade.ativo && financeiro.mensalidade.valor > 0) {
    const p = await db.collection('pagamentos').findOne({ solicitacao_id: solicitacao._id, tipo_taxa: 'mensalidade', mes: '1a' });
    if (!p || !['pago', 'confirmado'].includes(p.estado)) {
      pendentes.push({ tipo_taxa: 'mensalidade', descricao: 'Primeira Mensalidade', valor: financeiro.mensalidade.valor });
    }
  }

  return pendentes;
}

module.exports = {
  getGestor,
  getEncarregado,
  criar,
  uploadComprovativo,
  pagarPlataforma,
  confirmar,
  rejeitar,
  gerarMensalidades,
  gerarMensalidadesInterno,
  avisar,
  gerarNumeroProcesso,
  garantirTransacoesMatricula,
  verificarPagamentosMatricula,
  TIPOS_TAXA
};