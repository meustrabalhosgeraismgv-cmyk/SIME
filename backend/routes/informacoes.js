const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/:instituicaoId', async (req, res) => {
  try {
    const db = getDB();
    let info = await db.collection('informacoes_instituicao').findOne({
      instituicao_id: req.params.instituicaoId
    });

    if (!info) {
      await db.collection('informacoes_instituicao').insertOne({
        instituicao_id: req.params.instituicaoId
      });
      info = await db.collection('informacoes_instituicao').findOne({
        instituicao_id: req.params.instituicaoId
      });
    }

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informações' });
  }
});

router.put('/:instituicaoId', authenticateToken, authorizeRole('admin', 'instituicao'), async (req, res) => {
  try {
    const db = getDB();
    const {
      horario_atendimento, dias_atendimento, documentos_necessarios,
      procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
      email_secretaria, endereco_secretaria, website, link_portal_estudante,
      notas_admissionais
    } = req.body;

    const updateData = {
      horario_atendimento, dias_atendimento, documentos_necessarios,
      procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
      email_secretaria, endereco_secretaria, website, link_portal_estudante,
      notas_admissionais
    };

    const exists = await db.collection('informacoes_instituicao').findOne({
      instituicao_id: req.params.instituicaoId
    });

    if (exists) {
      await db.collection('informacoes_instituicao').updateOne(
        { instituicao_id: req.params.instituicaoId },
        { $set: updateData }
      );
    } else {
      await db.collection('informacoes_instituicao').insertOne({
        instituicao_id: req.params.instituicaoId,
        ...updateData
      });
    }

    res.json({ message: 'Informações atualizadas' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar informações' });
  }
});

module.exports = router;
