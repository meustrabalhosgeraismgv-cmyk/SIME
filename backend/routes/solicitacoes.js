const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');
const { resolverEncarregado } = require('../utils/encarregadoUtil');
const upload = require('../middleware/upload');

function emitSolicitacao(io, evento, solicitacao) {
  if (!io) return;
  io.emit(evento, solicitacao);
  if (solicitacao.encarregado_id) {
    io.to('entidade:' + solicitacao.encarregado_id.toString()).emit(evento, solicitacao);
  }
  if (solicitacao.instituicao_id) {
    io.to('instituicao:' + solicitacao.instituicao_id.toString()).emit(evento, solicitacao);
  }
}

function toSolicitacao(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc._id ? doc._id.toString() : null,
    encarregado_id: doc.encarregado_id ? doc.encarregado_id.toString() : null,
    instituicao_id: doc.instituicao_id ? doc.instituicao_id.toString() : null,
    curso_id: doc.curso_id ? doc.curso_id.toString() : null,
    turma_id: doc.turma_id ? doc.turma_id.toString() : null,
    documentos: Array.isArray(doc.documentos) ? doc.documentos : [],
    formulario_respostas: Array.isArray(doc.formulario_respostas) ? doc.formulario_respostas : [],
  };
}

router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { estado = '', search = '' } = req.query;

    const matchStage = {};
    if (estado) matchStage.estado = estado;
    if (search) {
      const r = new RegExp(search, 'i');
      matchStage.$or = [{ aluno_nome: r }, { aluno_bi: r }];
    }

    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'municipios', localField: 'instituicao.municipio_id', foreignField: '_id', as: 'mun' } },
      { $unwind: { path: '$mun', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'encarregados',
          let: { eid: { $toString: '$encarregado_id' } },
          pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$eid'] } } }],
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'cursos', localField: 'curso_id', foreignField: '_id', as: 'curso' } },
      { $unwind: { path: '$curso', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'turmas', localField: 'turma_id', foreignField: '_id', as: 'turma' } },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        id: { $toString: '$_id' },
        encarregado_id: { $toString: '$encarregado_id' },
        instituicao_id: { $toString: '$instituicao_id' },
        instituicao_nome: '$instituicao.nome',
        instituicao_municipio: '$mun.nome',
        instituicao_tipo: '$instituicao.tipo',
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        curso_nome: '$curso.nome',
        turma_nome: '$turma.nome',
        turma_nivel: '$turma.nivel'
      } },
      { $project: { instituicao: 0, encarregado: 0, curso: 0, mun: 0, turma: 0 } },
      { $sort: { created_at: -1 } },
      { $limit: 200 }
    ];

    const solicitacoes = await db.collection('solicitacoes').aggregate(pipeline).toArray();

    const statsPipeline = [
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ];
    const statsRows = await db.collection('solicitacoes').aggregate(statsPipeline).toArray();
    const stats = {
      total: solicitacoes.length,
      pendente: 0,
      aceite: 0,
      agendado: 0,
      rejeitada: 0,
      inscrito: 0
    };
    statsRows.forEach(r => { if (r._id in stats) stats[r._id] = r.total; });

    res.json({ data: solicitacoes, stats });
  } catch (error) {
    console.error('Erro no painel de solicitações admin:', error);
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/gestor', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = usuario?.entidade_id;
    if (!instituicaoId) return res.status(400).json({ error: 'Conta não vinculada a nenhuma instituição' });

    const solicitacoes = await db.collection('solicitacoes').aggregate([
      { $match: { instituicao_id: new ObjectId(instituicaoId) } },
      {
        $lookup: {
          from: 'encarregados',
          let: { eid: { $toString: '$encarregado_id' } },
          pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$eid'] } } }],
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
      { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'turmas', localField: 'turma_id', foreignField: '_id', as: 'turma' } },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        comunicado_titulo: '$comunicado.titulo',
        turma_nome: '$turma.nome',
        turma_nivel: '$turma.nivel'
      } },
      { $project: { encarregado: 0, comunicado: 0, turma: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: solicitacoes.map(toSolicitacao) });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/encarregado', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = await resolverEncarregado(usuario);

    const solicitacoes = await db.collection('solicitacoes').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
      { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'turmas', localField: 'turma_id', foreignField: '_id', as: 'turma' } },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        instituicao_nome: '$instituicao.nome',
        comunicado_titulo: '$comunicado.titulo',
        turma_nome: '$turma.nome',
        turma_nivel: '$turma.nivel'
      } },
      { $project: { instituicao: 0, comunicado: 0, turma: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: solicitacoes.map(toSolicitacao) });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const {
      instituicao_id, comunicado_id, aluno_nome, aluno_data_nascimento,
      aluno_sexo, curso_id, turma_id, necessidades_especiais, aluno_bi,
      observacoes, documentos, formulario_respostas
    } = req.body;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = await resolverEncarregado(usuario);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const avisos = [];
    let turma = null;
    if (turma_id) {
      turma = await db.collection('turmas').findOne({ _id: new ObjectId(turma_id) });
      if (!turma) return res.status(400).json({ error: 'Turma não encontrada' });
      if ((turma.vagas_ocupadas || 0) >= (turma.vagas || 0)) {
        return res.status(400).json({ error: 'A turma selecionada já não tem vagas disponíveis' });
      }
    }

    if (aluno_data_nascimento) {
      const nascimento = new Date(aluno_data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
      const nivel = turma?.nivel || '';
      const primario = ['1a_classe', '2a_classe', '3a_classe', '4a_classe', '5a_classe', '6a_classe'];
      if (primario.includes(nivel) && idade < 6) {
        return res.status(400).json({ error: `Candidatura bloqueada: a idade calculada (${idade} anos) é inferior à mínima legal de 6 anos para o Ensino Primário.` });
      }
      if (nivel && !primario.includes(nivel) && idade < 10) {
        avisos.push(`O aluno tem ${idade} anos. Verifique os critérios de admissão da instituição.`);
      }
    }

    const now = new Date();
    const result = await db.collection('solicitacoes').insertOne({
      encarregado_id: encarregadoId,
      instituicao_id: instituicao_id ? new ObjectId(instituicao_id) : null,
      comunicado_id: comunicado_id || null,
      aluno_nome,
      aluno_data_nascimento: aluno_data_nascimento || null,
      aluno_sexo: aluno_sexo || null,
      curso_id: curso_id || null,
      turma_id: turma_id ? new ObjectId(turma_id) : null,
      aluno_bi: aluno_bi || null,
      necessidades_especiais: necessidades_especiais || '',
      observacoes: observacoes || '',
      documentos: Array.isArray(documentos) ? documentos : [],
      formulario_respostas: Array.isArray(formulario_respostas) ? formulario_respostas : [],
      estado: 'pendente',
      historico: [{ estado: 'pendente', data: now, autor: usuario.nome || usuario.username }],
      created_at: now
    });

    if (comunicado_id) {
      const comunicado = await db.collection('comunicados').findOne({ _id: new ObjectId(comunicado_id) });
      if (comunicado && comunicado.valor > 0) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + 3);
        await db.collection('pagamentos').insertOne({
          solicitacao_id: result.insertedId,
          instituicao_id: instituicao_id ? new ObjectId(instituicao_id) : null,
          encarregado_id: encarregadoId,
          valor: comunicado.valor,
          tipo: 'reserva',
          data_limite: dataLimite,
          estado: 'pendente',
          created_at: now
        });
      }
    }

    if (instituicao_id) {
      const financeira = await db.collection('configuracoes_financeiras').findOne({ instituicao_id: new ObjectId(instituicao_id) });
      const valorInscricao = financeira?.emolumento_inscricao?.ativo ? (parseFloat(financeira.emolumento_inscricao.valor) || 0) : 0;
      if (valorInscricao > 0) {
        const global = await db.collection('configuracoes_globais').findOne({ chave: 'pagamento' });
        const plataforma = !!global?.pagamento_plataforma_ativado;
        const referencia = `REF-${now.getFullYear()}-${Date.now().toString(36).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
        await db.collection('pagamentos').insertOne({
          solicitacao_id: result.insertedId,
          instituicao_id: new ObjectId(instituicao_id),
          encarregado_id: encarregadoId,
          tipo_taxa: 'inscricao',
          descricao: 'Emolumento de Inscrição',
          valor: valorInscricao,
          referencia,
          forma_pagamento: plataforma ? 'plataforma' : 'comprovativo',
          estado: 'pendente',
          created_at: now
        });
        avisos.push(`Emolumento de inscrição de ${valorInscricao.toLocaleString('pt-AO')} Kz: efetue o pagamento e carregue o comprovativo no portal.`);
      }
    }

    const solicitacao = toSolicitacao(await db.collection('solicitacoes').findOne({ _id: result.insertedId }));
    emitSolicitacao(req.app.get('io'), 'solicitacao:novo', solicitacao);

    res.status(201).json({ id: result.insertedId, message: 'Solicitação criada', avisos });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

async function atualizarEstado(req, res, estado, extra = {}) {
  try {
    const db = getDB();
    const id = req.params.id;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const solicitacao = await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) });
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const historico = [
      ...(solicitacao.historico || []),
      { estado, data: new Date(), autor: usuario.nome || usuario.username, observacoes: req.body.observacoes || '' }
    ];

    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado, data_resposta: new Date(), historico, ...extra } }
    );

    const atualizada = toSolicitacao(await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) }));
    emitSolicitacao(req.app.get('io'), 'solicitacao:update', atualizada);
    res.json({ message: 'Atualizada', solicitacao: atualizada });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
}

router.put('/:id/aceitar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const solicitacao = await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) });
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const instituicao = solicitacao.instituicao_id
      ? await db.collection('instituicoes').findOne({ _id: new ObjectId(solicitacao.instituicao_id) })
      : null;

    const comunicado = {
      titulo: 'Vaga Aprovada — Matrícula Disponivel',
      conteudo: `A sua vaga para "${solicitacao.aluno_nome}" na ${instituicao?.nome || 'instituição'} foi APROVADA. Aceda ao portal, no separador "As Minhas Solicitações", e clique em "Iniciar Matrícula" para preencher os requisitos de matrícula e efetuar o pagamento.`,
      tipo: 'vaga_aceite',
      instituicao_id: solicitacao.instituicao_id || null,
      destinatario_id: solicitacao.encarregado_id || null,
      publicado: 1,
      destaque: 0,
      autor_id: new ObjectId(req.user.id),
      autor_nome: usuario?.nome || usuario?.username || 'Instituição',
      created_at: new Date()
    };
    const comResult = await db.collection('comunicados').insertOne(comunicado);

    const historico = [
      ...(solicitacao.historico || []),
      { estado: 'aceite', data: new Date(), autor: usuario.nome || usuario.username, observacoes: req.body.observacoes || '' }
    ];

    await db.collection('solicitacoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'aceite', data_resposta: new Date(), historico, comunicado_id: comResult.insertedId } }
    );

    const atualizada = toSolicitacao(await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) }));
    emitSolicitacao(req.app.get('io'), 'solicitacao:update', atualizada);

    const io = req.app.get('io');
    if (io && solicitacao.encarregado_id) {
      io.to('entidade:' + solicitacao.encarregado_id.toString()).emit('comunicado:novo', {
        comunicado_id: comResult.insertedId.toString(),
        titulo: comunicado.titulo,
        tipo: 'vaga_aceite'
      });
    }

    res.json({ message: 'Solicitação aceite e notificação automática enviada ao encarregado', solicitacao: atualizada, comunicado_id: comResult.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});
router.put('/:id/rejeitar', authenticateToken, (req, res) => atualizarEstado(req, res, 'rejeitada', { observacoes: req.body.observacoes || '' }));
router.put('/:id/agendar', authenticateToken, (req, res) => atualizarEstado(req, res, 'agendado', { observacoes: req.body.observacoes || '' }));
router.put('/:id/inscrever', authenticateToken, (req, res) => atualizarEstado(req, res, 'inscrito'));

router.put('/:id/retomar', authenticateToken, (req, res) => atualizarEstado(req, res, 'aceite'));

router.post('/upload-documento', authenticateToken, upload.documentos.single('ficheiro'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    const url = `/uploads/documentos/${req.file.filename}`;
    res.status(201).json({ url, message: 'Documento carregado' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao carregar documento' });
  }
});

module.exports = router;