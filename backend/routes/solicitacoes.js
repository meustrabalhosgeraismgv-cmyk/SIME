const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Gestor: ver solicitações da sua instituição
router.get('/gestor', authenticateToken, (req, res) => {
  try {
    const solicitacoes = db.prepare(`
      SELECT s.*, e.nome_completo as encarregado_nome, e.telefone as encarregado_telefone, c.titulo as comunicado_titulo
      FROM solicitacoes s
      LEFT JOIN encarregados e ON s.encarregado_id = e.id
      LEFT JOIN comunicados c ON s.comunicado_id = c.id
      WHERE s.instituicao_id = (SELECT entidade_id FROM usuarios WHERE id=?)
      ORDER BY s.created_at DESC
    `).all(req.user.id);
    res.json({ data: solicitacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Encarregado: ver suas solicitações
router.get('/encarregado', authenticateToken, (req, res) => {
  try {
    const solicitacoes = db.prepare(`
      SELECT s.*, i.nome as instituicao_nome, c.titulo as comunicado_titulo
      FROM solicitacoes s
      LEFT JOIN instituicoes i ON s.instituicao_id = i.id
      LEFT JOIN comunicados c ON s.comunicado_id = c.id
      WHERE s.encarregado_id = (SELECT entidade_id FROM usuarios WHERE id=?)
      ORDER BY s.created_at DESC
    `).all(req.user.id);
    res.json({ data: solicitacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Encarregado: criar solicitação
router.post('/', authenticateToken, (req, res) => {
  try {
    const { instituicao_id, comunicado_id, aluno_nome, aluno_data_nascimento, aluno_sexo } = req.body;
    const encarregado = db.prepare('SELECT entidade_id FROM usuarios WHERE id=?').get(req.user.id);
    if (!encarregado) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const result = db.prepare(
      'INSERT INTO solicitacoes (encarregado_id, instituicao_id, comunicado_id, aluno_nome, aluno_data_nascimento, aluno_sexo) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(encarregado.entidade_id, instituicao_id, comunicado_id || null, aluno_nome, aluno_data_nascimento || null, aluno_sexo || null);

    // Se tem comunicado com valor, criar pagamento de reserva
    if (comunicado_id) {
      const comunicado = db.prepare('SELECT * FROM comunicados WHERE id=?').get(comunicado_id);
      if (comunicado && comunicado.valor > 0) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + 3);
        db.prepare(
          'INSERT INTO pagamentos (solicitacao_id, instituicao_id, encarregado_id, valor, tipo, data_limite) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(result.lastInsertRowid, instituicao_id, encarregado.entidade_id, comunicado.valor, 'reserva', dataLimite.toISOString());
      }
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Solicitação criada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Gestor: aceitar/rejeitar
router.put('/:id/aceitar', authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE solicitacoes SET estado='aceite', data_resposta=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
    res.json({ message: 'Aceite' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/rejeitar', authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE solicitacoes SET estado='rejeitada', data_resposta=CURRENT_TIMESTAMP, observacoes=? WHERE id=?").run(req.body.observacoes || '', req.params.id);
    res.json({ message: 'Rejeitada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/agendar', authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE solicitacoes SET estado='agendado', observacoes=? WHERE id=?").run(req.body.observacoes || '', req.params.id);
    res.json({ message: 'Agendado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/inscrever', authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE solicitacoes SET estado='inscrito', data_resposta=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
    res.json({ message: 'Inscrito' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
