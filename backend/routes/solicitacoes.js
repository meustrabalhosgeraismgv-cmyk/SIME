const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

function emitSolicitacao(io, evento, solicitacao) {
  if (!io) return;
  io.emit(evento, solicitacao);
  if (solicitacao.encarregado_id) {
    io.to('user:' + solicitacao.encarregado_id.toString()).emit(evento, solicitacao);
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
      { $addFields: {
        id: { $toString: '$_id' },
        encarregado_id: { $toString: '$encarregado_id' },
        instituicao_id: { $toString: '$instituicao_id' },
        instituicao_nome: '$instituicao.nome',
        instituicao_municipio: '$mun.nome',
        instituicao_tipo: '$instituicao.tipo',
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        curso_nome: '$curso.nome'
      } },
      { $project: { instituicao: 0, encarregado: 0, curso: 0, mun: 0 } },
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
      { $addFields: {
        encarregado_nome: '$encarregado.nome_completo',
        encarregado_telefone: '$encarregado.telefone',
        comunicado_titulo: '$comunicado.titulo'
      } },
      { $project: { encarregado: 0, comunicado: 0 } },
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
    const encarregadoId = usuario?.entidade_id;

    const solicitacoes = await db.collection('solicitacoes').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'comunicados', localField: 'comunicado_id', foreignField: '_id', as: 'comunicado' } },
      { $unwind: { path: '$comunicado', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        instituicao_nome: '$instituicao.nome',
        comunicado_titulo: '$comunicado.titulo'
      } },
      { $project: { instituicao: 0, comunicado: 0 } },
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
      aluno_sexo, curso_id, necessidades_especiais, aluno_bi, observacoes
    } = req.body;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = usuario?.entidade_id;
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const now = new Date();
    const result = await db.collection('solicitacoes').insertOne({
      encarregado_id: encarregadoId,
      instituicao_id: instituicao_id ? new ObjectId(instituicao_id) : null,
      comunicado_id: comunicado_id || null,
      aluno_nome,
      aluno_data_nascimento: aluno_data_nascimento || null,
      aluno_sexo: aluno_sexo || null,
      curso_id: curso_id || null,
      aluno_bi: aluno_bi || null,
      necessidades_especiais: necessidades_especiais || '',
      observacoes: observacoes || '',
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

    const solicitacao = toSolicitacao(await db.collection('solicitacoes').findOne({ _id: result.insertedId }));
    emitSolicitacao(req.app.get('io'), 'solicitacao:novo', solicitacao);

    res.status(201).json({ id: result.insertedId, message: 'Solicitação criada' });
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

router.put('/:id/aceitar', authenticateToken, (req, res) => atualizarEstado(req, res, 'aceite'));
router.put('/:id/rejeitar', authenticateToken, (req, res) => atualizarEstado(req, res, 'rejeitada', { observacoes: req.body.observacoes || '' }));
router.put('/:id/agendar', authenticateToken, (req, res) => atualizarEstado(req, res, 'agendado', { observacoes: req.body.observacoes || '' }));
router.put('/:id/inscrever', authenticateToken, (req, res) => atualizarEstado(req, res, 'inscrito'));

router.put('/:id/retomar', authenticateToken, (req, res) => atualizarEstado(req, res, 'aceite'));

module.exports = router;