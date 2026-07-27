const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const canCreateGroup = (perfil) => perfil === 'admin' || perfil === 'instituicao';

const canCreatePrivate = (perfil) => ['admin', 'instituicao', 'encarregado'].includes(perfil);

function getOtherParticipant(conversaId, userId) {
  return db.prepare(`
    SELECT u.id, u.username, u.nome, u.perfil, u.foto, u.entidade_id, u.entidade_tipo
    FROM conversa_participantes cp
    JOIN usuarios u ON cp.usuario_id = u.id
    WHERE cp.conversa_id = ? AND cp.usuario_id != ?
  `).get(conversaId, userId);
}

function getConversationInfo(conversaId, userId) {
  const conversa = db.prepare('SELECT * FROM conversas WHERE id = ?').get(conversaId);
  if (!conversa) return null;

  const participantes = db.prepare(`
    SELECT u.id, u.username, u.nome, u.perfil, u.foto, u.entidade_id, u.entidade_tipo, cp.cargo
    FROM conversa_participantes cp
    JOIN usuarios u ON cp.usuario_id = u.id
    WHERE cp.conversa_id = ?
  `).all(conversaId);

  const lastMsg = db.prepare(`
    SELECT m.*, u.nome as remetente_nome
    FROM mensagens m JOIN usuarios u ON m.remetente_id = u.id
    WHERE m.conversa_id = ?
    ORDER BY m.created_at DESC LIMIT 1
  `).get(conversaId);

  const unread = db.prepare(`
    SELECT COUNT(*) as count FROM mensagens
    WHERE conversa_id = ? AND remetente_id != ? AND created_at > (
      SELECT lido_ate FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?
    )
  `).get(conversaId, userId, conversaId, userId);

  return { ...conversa, participantes, ultima_mensagem: lastMsg || null, nao_lidas: unread?.count || 0 };
}

router.get('/conversas', authenticateToken, (req, res) => {
  try {
    const participacoes = db.prepare(
      'SELECT conversa_id FROM conversa_participantes WHERE usuario_id = ?'
    ).all(req.user.id).map(r => r.conversa_id);

    if (participacoes.length === 0) return res.json({ data: [] });

    const conversas = participacoes.map(cid => getConversationInfo(cid, req.user.id)).filter(Boolean);
    conversas.sort((a, b) => {
      const ta = a.ultima_mensagem?.created_at || a.created_at;
      const tb = b.ultima_mensagem?.created_at || b.created_at;
      return new Date(tb) - new Date(ta);
    });

    res.json({ data: conversas });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

router.post('/conversas', authenticateToken, (req, res) => {
  try {
    const { tipo, nome, descricao, participantes } = req.body;
    const userId = req.user.id;
    const user = db.prepare('SELECT perfil FROM usuarios WHERE id = ?').get(userId);

    if (tipo === 'grupo' && !canCreateGroup(user.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para criar grupos' });
    }
    if (!canCreatePrivate(user.perfil) && tipo !== 'grupo') {
      return res.status(403).json({ error: 'Sem permissão para criar conversas' });
    }

    if (tipo === 'privada') {
      if (!participantes || participantes.length === 0) {
        return res.status(400).json({ error: 'Selecione pelo menos um participante' });
      }

      const otherUserId = participantes[0];
      const otherUser = db.prepare('SELECT id, perfil FROM usuarios WHERE id = ?').get(otherUserId);
      if (!otherUser) return res.status(404).json({ error: 'Utilizador não encontrado' });

      const existing = db.prepare(`
        SELECT c.id FROM conversas c
        WHERE c.tipo = 'privada'
        AND EXISTS (SELECT 1 FROM conversa_participantes WHERE conversa_id = c.id AND usuario_id = ?)
        AND EXISTS (SELECT 1 FROM conversa_participantes WHERE conversa_id = c.id AND usuario_id = ?)
      `).get(userId, otherUserId);

      if (existing) {
        return res.json({ id: existing.id, message: 'Conversa já existe' });
      }

      const result = db.prepare(
        "INSERT INTO conversas (tipo, criado_por) VALUES ('privada', ?)"
      ).run(userId);

      const conversaId = result.lastInsertRowid;
      db.prepare('INSERT INTO conversa_participantes (conversa_id, usuario_id, cargo) VALUES (?, ?, ?)').run(conversaId, userId, 'admin');
      db.prepare('INSERT INTO conversa_participantes (conversa_id, usuario_id, cargo) VALUES (?, ?, ?)').run(conversaId, otherUserId, 'membro');

      res.status(201).json({ id: conversaId, message: 'Conversa criada' });

    } else if (tipo === 'grupo') {
      if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do grupo obrigatório' });
      if (!participantes || participantes.length < 1) return res.status(400).json({ error: 'Adicione pelo menos 1 participante' });

      const result = db.prepare(
        "INSERT INTO conversas (tipo, nome, descricao, criado_por) VALUES ('grupo', ?, ?, ?)"
      ).run(nome.trim(), descricao || null, userId);

      const conversaId = result.lastInsertRowid;
      db.prepare('INSERT INTO conversa_participantes (conversa_id, usuario_id, cargo) VALUES (?, ?, ?)').run(conversaId, userId, 'admin');

      for (const pid of participantes) {
        db.prepare('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id, cargo) VALUES (?, ?, ?)').run(conversaId, pid, 'membro');
      }

      db.prepare(
        "INSERT INTO mensagens (conversa_id, remetente_id, conteudo, tipo) VALUES (?, ?, ?, 'sistema')"
      ).run(conversaId, userId, `${req.user.username || 'Utilizador'} criou o grupo "${nome.trim()}"`);

      res.status(201).json({ id: conversaId, message: 'Grupo criado' });
    }
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

router.get('/conversas/:id', authenticateToken, (req, res) => {
  try {
    const participacao = db.prepare(
      'SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?'
    ).get(req.params.id, req.user.id);

    if (!participacao) return res.status(403).json({ error: 'Sem acesso a esta conversa' });

    const conversa = getConversationInfo(parseInt(req.params.id), req.user.id);
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    res.json(conversa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

router.get('/conversas/:id/mensagens', authenticateToken, (req, res) => {
  try {
    const participacao = db.prepare(
      'SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?'
    ).get(req.params.id, req.user.id);

    if (!participacao) return res.status(403).json({ error: 'Sem acesso' });

    const { antes, limite = 50 } = req.query;
    let query = `
      SELECT m.*, u.nome as remetente_nome, u.username as remetente_username, u.perfil as remetente_perfil, u.foto as remetente_foto
      FROM mensagens m JOIN usuarios u ON m.remetente_id = u.id
      WHERE m.conversa_id = ?
    `;
    const params = [req.params.id];

    if (antes) {
      query += ' AND m.id < ?';
      params.push(antes);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limite));

    const mensagens = db.prepare(query).all(...params).reverse();

    db.prepare(
      "UPDATE conversa_participantes SET lido_ate = CURRENT_TIMESTAMP WHERE conversa_id = ? AND usuario_id = ?"
    ).run(req.params.id, req.user.id);

    res.json({ data: mensagens });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

router.post('/conversas/:id/mensagens', authenticateToken, (req, res) => {
  try {
    const { conteudo, tipo = 'texto', ficheiro_url, respondendo_a } = req.body;
    if (!conteudo || !conteudo.trim()) return res.status(400).json({ error: 'Mensagem vazia' });

    const participacao = db.prepare(
      'SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?'
    ).get(req.params.id, req.user.id);

    if (!participacao) return res.status(403).json({ error: 'Sem acesso' });

    const result = db.prepare(
      'INSERT INTO mensagens (conversa_id, remetente_id, conteudo, tipo, ficheiro_url, respondendo_a) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.params.id, req.user.id, conteudo.trim(), tipo, ficheiro_url || null, respondendo_a || null);

    db.prepare("UPDATE conversas SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

    const msg = db.prepare(`
      SELECT m.*, u.nome as remetente_nome, u.username as remetente_username, u.perfil as remetente_perfil, u.foto as remetente_foto
      FROM mensagens m JOIN usuarios u ON m.remetente_id = u.id WHERE m.id = ?
    `).get(result.lastInsertRowid);

    const io = req.app.get('io');
    if (io) {
      io.to('conversa:' + req.params.id).emit('new-message', msg);
    }

    res.status(201).json(msg);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.get('/utilizadores', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT perfil FROM usuarios WHERE id = ?').get(req.user.id);
    let query = 'SELECT id, username, nome, perfil, foto, entidade_id, entidade_tipo FROM usuarios WHERE aprovado = 1 AND id != ?';
    const params = [req.user.id];

    if (user.perfil === 'admin') {
      // Admin can message everyone
    } else if (user.perfil === 'instituicao') {
      query += " AND perfil IN ('admin', 'encarregado')";
    } else if (user.perfil === 'encarregado') {
      query += " AND perfil IN ('admin', 'instituicao')";
    }

    query += ' ORDER BY nome, username';
    const users = db.prepare(query).all(...params);
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

router.post('/conversas/:id/participantes', authenticateToken, (req, res) => {
  try {
    const { usuario_id } = req.body;
    const participacao = db.prepare(
      "SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ? AND cargo = 'admin'"
    ).get(req.params.id, req.user.id);

    if (!participacao) return res.status(403).json({ error: 'Sem permissão de admin' });

    const conversa = db.prepare('SELECT tipo FROM conversas WHERE id = ?').get(req.params.id);
    if (!conversa || conversa.tipo !== 'grupo') return res.status(400).json({ error: 'Só é possível adicionar a grupos' });

    db.prepare('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)').run(req.params.id, usuario_id);

    const newUser = db.prepare('SELECT nome, username FROM usuarios WHERE id = ?').get(usuario_id);
    db.prepare(
      "INSERT INTO mensagens (conversa_id, remetente_id, conteudo, tipo) VALUES (?, ?, ?, 'sistema')"
    ).run(req.params.id, req.user.id, `${req.user.username} adicionou ${newUser?.nome || newUser?.username || 'utilizador'}`);

    const io = req.app.get('io');
    if (io) {
      io.to('conversa:' + req.params.id).emit('member-added', { usuario_id });
    }

    res.json({ message: 'Participante adicionado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar participante' });
  }
});

router.delete('/conversas/:id/participantes/:userId', authenticateToken, (req, res) => {
  try {
    const participacao = db.prepare(
      "SELECT 1 FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ? AND cargo = 'admin'"
    ).get(req.params.id, req.user.id);

    if (!participacao) return res.status(403).json({ error: 'Sem permissão' });

    db.prepare('DELETE FROM conversa_participantes WHERE conversa_id = ? AND usuario_id = ?').run(req.params.id, req.params.userId);
    res.json({ message: 'Participante removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover participante' });
  }
});

module.exports = router;
