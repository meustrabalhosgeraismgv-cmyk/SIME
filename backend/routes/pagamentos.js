const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Gestor: pagamentos da instituição
router.get('/gestor', authenticateToken, (req, res) => {
  try {
    const pagamentos = db.prepare(`
      SELECT p.*, e.nome_completo as encarregado_nome, s.aluno_nome
      FROM pagamentos p
      LEFT JOIN encarregados e ON p.encarregado_id = e.id
      LEFT JOIN solicitacoes s ON p.solicitacao_id = s.id
      WHERE p.instituicao_id = (SELECT entidade_id FROM usuarios WHERE id=?)
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json({ data: pagamentos });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Encarregado: seus pagamentos
router.get('/encarregado', authenticateToken, (req, res) => {
  try {
    const pagamentos = db.prepare(`
      SELECT p.*, i.nome as instituicao_nome, s.aluno_nome
      FROM pagamentos p
      LEFT JOIN instituicoes i ON p.instituicao_id = i.id
      LEFT JOIN solicitacoes s ON p.solicitacao_id = s.id
      WHERE p.encarregado_id = (SELECT entidade_id FROM usuarios WHERE id=?)
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json({ data: pagamentos });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Confirmar pagamento (gestor)
router.put('/:id/confirmar', authenticateToken, (req, res) => {
  try {
    const recibo = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    db.prepare(
      "UPDATE pagamentos SET estado='pago', data_pagamento=CURRENT_TIMESTAMP, recibo_numero=? WHERE id=?"
    ).run(recibo, req.params.id);
    res.json({ message: 'Pago', recibo_numero: recibo });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Cancelar pagamento
router.put('/:id/cancelar', authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE pagamentos SET estado='cancelado' WHERE id=?").run(req.params.id);
    res.json({ message: 'Cancelado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
