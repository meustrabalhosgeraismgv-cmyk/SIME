const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/:instituicaoId', (req, res) => {
  try {
    let info = db.prepare('SELECT * FROM informacoes_instituicao WHERE instituicao_id = ?').get(req.params.instituicaoId);
    if (!info) {
      db.prepare('INSERT INTO informacoes_instituicao (instituicao_id) VALUES (?)').run(req.params.instituicaoId);
      info = db.prepare('SELECT * FROM informacoes_instituicao WHERE instituicao_id = ?').get(req.params.instituicaoId);
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informações' });
  }
});

router.put('/:instituicaoId', authenticateToken, authorizeRole('admin', 'instituicao'), (req, res) => {
  try {
    const {
      horario_atendimento, dias_atendimento, documentos_necessarios,
      procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
      email_secretaria, endereco_secretaria, website, link_portal_estudante,
      notas_admissionais
    } = req.body;

    const exists = db.prepare('SELECT id FROM informacoes_instituicao WHERE instituicao_id = ?').get(req.params.instituicaoId);
    if (exists) {
      db.prepare(`
        UPDATE informacoes_instituicao SET
          horario_atendimento=?, dias_atendimento=?, documentos_necessarios=?,
          procedimentos_inscricao=?, taxa_reserva_rupe=?, telefone_secretaria=?,
          email_secretaria=?, endereco_secretaria=?, website=?, link_portal_estudante=?,
          notas_admissionais=?
        WHERE instituicao_id=?
      `).run(
        horario_atendimento, dias_atendimento, documentos_necessarios,
        procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
        email_secretaria, endereco_secretaria, website, link_portal_estudante,
        notas_admissionais, req.params.instituicaoId
      );
    } else {
      db.prepare(`
        INSERT INTO informacoes_instituicao
          (instituicao_id, horario_atendimento, dias_atendimento, documentos_necessarios,
           procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
           email_secretaria, endereco_secretaria, website, link_portal_estudante,
           notas_admissionais)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.params.instituicaoId,
        horario_atendimento, dias_atendimento, documentos_necessarios,
        procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria,
        email_secretaria, endereco_secretaria, website, link_portal_estudante,
        notas_admissionais
      );
    }
    res.json({ message: 'Informações atualizadas' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar informações' });
  }
});

module.exports = router;
