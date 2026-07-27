const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/gestor', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = usuario?.entidade_id;

    const pagamentos = await db.collection('pagamentos').aggregate([
      { $match: { instituicao_id: instituicaoId } },
      { $lookup: { from: 'encarregados', localField: 'encarregado_id', foreignField: '_id', as: 'encarregado' } },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'solicitacoes', localField: 'solicitacao_id', foreignField: '_id', as: 'solicitacao' } },
      { $unwind: { path: '$solicitacao', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        encarregado_nome: '$encarregado.nome_completo',
        aluno_nome: '$solicitacao.aluno_nome'
      } },
      { $project: { encarregado: 0, solicitacao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: pagamentos });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/encarregado', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = usuario?.entidade_id;

    const pagamentos = await db.collection('pagamentos').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'solicitacoes', localField: 'solicitacao_id', foreignField: '_id', as: 'solicitacao' } },
      { $unwind: { path: '$solicitacao', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        instituicao_nome: '$instituicao.nome',
        aluno_nome: '$solicitacao.aluno_nome'
      } },
      { $project: { instituicao: 0, solicitacao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: pagamentos });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/confirmar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const recibo = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'pago', data_pagamento: new Date(), recibo_numero: recibo } }
    );
    res.json({ message: 'Pago', recibo_numero: recibo });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/cancelar', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('pagamentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado: 'cancelado' } }
    );
    res.json({ message: 'Cancelado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
