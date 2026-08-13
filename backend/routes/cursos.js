const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/:instituicaoId', async (req, res) => {
  try {
    const db = getDB();
    const { tipo } = req.query;
    const filter = { instituicao_id: req.params.instituicaoId };
    if (tipo) filter.tipo = tipo;

    const cursos = await db.collection('cursos')
      .find(filter)
      .sort({ tipo: 1, grau: 1, nome: 1 })
      .toArray();

    res.json({ data: cursos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

router.post('/:instituicaoId', authenticateToken, authorizeRole('admin', 'instituicao'), async (req, res) => {
  try {
    const db = getDB();
    const { nome, tipo, grau, duracao, vagas_totais, turno } = req.body;

    const result = await db.collection('cursos').insertOne({
      instituicao_id: req.params.instituicaoId,
      nome,
      tipo: tipo || 'curso',
      grau: grau || 'tecnico',
      duracao: duracao || null,
      vagas_totais: vagas_totais || 0,
      vagas_disponiveis: vagas_totais || 0,
      turno: turno || 'diurno',
      estado: 'ativo',
      created_at: new Date()
    });

    res.status(201).json({ id: result.insertedId, message: 'Registo criado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar registo' });
  }
});

router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), async (req, res) => {
  try {
    const db = getDB();
    const { nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno, estado } = req.body;

    await db.collection('cursos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno, estado } }
    );
    res.json({ message: 'Atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), async (req, res) => {
  try {
    const db = getDB();
    await db.collection('cursos').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

module.exports = router;
