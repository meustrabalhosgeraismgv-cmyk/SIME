const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (usuario.aprovado === 0 && usuario.perfil === 'instituicao') {
      return res.status(403).json({ error: 'A sua conta de instituição ainda não foi aprovada pelo administrador.' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username, 
        perfil: usuario.perfil,
        is_gestor: usuario.is_gestor,
        entidade_id: usuario.entidade_id,
        entidade_tipo: usuario.entidade_tipo
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: usuario.id, 
        username: usuario.username, 
        perfil: usuario.perfil,
        is_gestor: !!usuario.is_gestor,
        nome: usuario.nome
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, perfil, nome, email, telefone, instituicao_nome, instituicao_municipio, instituicao_tipo } = req.body;

    if (!username || !password || !perfil) {
      return res.status(400).json({ error: 'Username, password e perfil são obrigatórios' });
    }

    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Nome de utilizador já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (perfil === 'instituicao') {
      if (!instituicao_nome) {
        return res.status(400).json({ error: 'Nome da instituição é obrigatório' });
      }

      const existingInst = db.prepare('SELECT id FROM instituicoes WHERE nome = ?').get(instituicao_nome);
      if (existingInst) {
        const hasGestor = db.prepare('SELECT id FROM usuarios WHERE entidade_id = ? AND entidade_tipo = ? AND is_gestor = 1').get(existingInst.id, 'instituicao');
        if (hasGestor) {
          return res.status(400).json({ error: 'Esta instituição já tem um gestor atribuído.' });
        }

        const result = db.prepare(
          'INSERT INTO usuarios (username, password, perfil, nome, email, telefone, is_gestor, entidade_id, entidade_tipo, aprovado) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 0)'
        ).run(username, hashedPassword, perfil, nome || null, email || null, telefone || null, existingInst.id, 'instituicao');

        res.status(201).json({
          message: 'Solicitação de reivindicação enviada. Aguarde aprovação do administrador.',
          id: result.lastInsertRowid
        });
        return;
      }

      let municipio_id = null;
      if (instituicao_municipio) {
        const mun = db.prepare('SELECT id FROM municipios WHERE nome = ?').get(instituicao_municipio);
        if (mun) municipio_id = mun.id;
      }

      const instResult = db.prepare(
        'INSERT INTO instituicoes (nome, tipo, municipio_id, email, telefone) VALUES (?, ?, ?, ?, ?)'
      ).run(instituicao_nome, instituicao_tipo || 'ensino_primario', municipio_id, email || null, telefone || null);

      const instId = instResult.lastInsertRowid;

      const result = db.prepare(
        'INSERT INTO usuarios (username, password, perfil, nome, email, telefone, is_gestor, entidade_id, entidade_tipo, aprovado) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 0)'
      ).run(username, hashedPassword, perfil, nome || null, email || null, telefone || null, instId, 'instituicao');

      res.status(201).json({
        message: 'Conta de instituição criada com sucesso. Aguarde aprovação do administrador.',
        id: result.lastInsertRowid
      });
    } else if (perfil === 'encarregado') {
      const result = db.prepare(
        'INSERT INTO usuarios (username, password, perfil, nome, email, telefone, aprovado) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).run(username, hashedPassword, perfil, nome || null, email || null, telefone || null);

      const token = jwt.sign(
        { id: result.lastInsertRowid, username, perfil, is_gestor: 0, entidade_id: null, entidade_tipo: null },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ 
        message: 'Conta criada com sucesso', 
        token,
        user: { id: result.lastInsertRowid, username, perfil }
      });
    } else if (perfil === 'admin') {
      const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM usuarios WHERE perfil = ?').get('admin');
      if (adminCount.cnt > 0) {
        return res.status(400).json({ error: 'Já existe um administrador no sistema' });
      }

      const result = db.prepare(
        'INSERT INTO usuarios (username, password, perfil, nome, email, aprovado) VALUES (?, ?, ?, ?, ?, 1)'
      ).run(username, hashedPassword, perfil, nome || null, email || null);

      const token = jwt.sign(
        { id: result.lastInsertRowid, username, perfil, is_gestor: 0, entidade_id: null, entidade_tipo: null },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ 
        message: 'Conta de administrador criada com sucesso', 
        token,
        user: { id: result.lastInsertRowid, username, perfil }
      });
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const uploadFoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }
    const fotoPath = `/uploads/fotos/${req.file.filename}`;
    db.prepare('UPDATE usuarios SET foto = ? WHERE id = ?').run(fotoPath, req.user.id);
    res.json({ foto: fotoPath, message: 'Foto atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
};

const getPerfilCompleto = (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nome, email, telefone, perfil, is_gestor, entidade_id, entidade_tipo, foto, aprovado FROM usuarios WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

    let dadosVinculados = {};

    if (user.perfil === 'admin') {
      const totalInstituicoes = db.prepare('SELECT COUNT(*) as total FROM instituicoes').get();
      const totalAlunos = db.prepare('SELECT COUNT(*) as total FROM alunos').get();
      const totalProfessores = db.prepare('SELECT COUNT(*) as total FROM professores').get();
      const totalTurmas = db.prepare('SELECT COUNT(*) as total FROM turmas').get();
      const vagas = db.prepare('SELECT COALESCE(SUM(vagas_totais),0) as total, COALESCE(SUM(vagas_disponiveis),0) as disponiveis FROM instituicoes').get();
      const usuarios = db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
      dadosVinculados = {
        total_instituicoes: totalInstituicoes.total,
        total_alunos: totalAlunos.total,
        total_professores: totalProfessores.total,
        total_turmas: totalTurmas.total,
        total_vagas: vagas.total,
        vagas_disponiveis: vagas.disponiveis,
        total_usuarios: usuarios.total
      };
    } else if (user.perfil === 'instituicao' && user.entidade_id) {
      const professores = db.prepare('SELECT id, nome_completo, especialidade, estado FROM professores WHERE instituicao_id = ?').all(user.entidade_id);
      const alunos = db.prepare('SELECT id, nome_completo, numero_estudante, estado FROM alunos WHERE instituicao_id = ?').all(user.entidade_id);
      const turmas = db.prepare('SELECT id, nome, nivel, vagas, vagas_ocupadas FROM turmas WHERE instituicao_id = ?').all(user.entidade_id);
      const vagas = db.prepare('SELECT vagas_totais, vagas_disponiveis FROM instituicoes WHERE id = ?').get(user.entidade_id);
      const solicitacoes = db.prepare("SELECT COUNT(*) as total FROM solicitacoes WHERE instituicao_id = ? AND estado = 'pendente'").get(user.entidade_id);
      dadosVinculados = {
        professores,
        alunos,
        turmas,
        vagas_totais: vagas?.vagas_totais || 0,
        vagas_disponiveis: vagas?.vagas_disponiveis || 0,
        solicitacoes_pendentes: solicitacoes.total
      };
    } else if (user.perfil === 'encarregado' && user.entidade_id) {
      const alunos = db.prepare(`
        SELECT a.id, a.nome_completo, a.numero_estudante, a.estado, i.nome as instituicao_nome
        FROM alunos a
        LEFT JOIN instituicoes i ON a.instituicao_id = i.id
        WHERE a.encarregado_id = ?
      `).all(user.entidade_id);
      const solicitacoes = db.prepare(`
        SELECT s.id, s.estado, s.aluno_nome, i.nome as instituicao_nome, s.created_at
        FROM solicitacoes s
        LEFT JOIN instituicoes i ON s.instituicao_id = i.id
        WHERE s.encarregado_id = ?
        ORDER BY s.created_at DESC LIMIT 5
      `).all(user.entidade_id);
      dadosVinculados = {
        alunos,
        solicitacoes
      };
    }

    res.json({ ...user, dados_vinculados: dadosVinculados });
  } catch (error) {
    console.error('Erro ao buscar perfil completo:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

module.exports = { login, register, uploadFoto, getPerfilCompleto };
