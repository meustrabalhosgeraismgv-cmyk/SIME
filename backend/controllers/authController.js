const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ username });
    if (!usuario) return res.status(401).json({ error: 'Credenciais inválidas' });

    if (!usuario.aprovado && usuario.perfil === 'instituicao') {
      return res.status(403).json({ error: 'A sua conta de instituição ainda não foi aprovada pelo administrador.' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({
      id: usuario._id.toString(),
      username: usuario.username,
      perfil: usuario.perfil,
      is_gestor: usuario.is_gestor,
      entidade_id: usuario.entidade_id,
      entidade_tipo: usuario.entidade_tipo
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: usuario._id.toString(),
        username: usuario.username,
        perfil: usuario.perfil,
        is_gestor: !!usuario.is_gestor,
        nome: usuario.nome
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, perfil, nome, email, telefone, instituicao_nome, instituicao_municipio, instituicao_tipo } = req.body;
    if (!username || !password || !perfil) {
      return res.status(400).json({ error: 'Username, password e perfil são obrigatórios' });
    }

    const db = getDB();
    const existingUser = await db.collection('usuarios').findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Nome de utilizador já existe' });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (perfil === 'instituicao') {
      if (!instituicao_nome) return res.status(400).json({ error: 'Nome da instituição é obrigatório' });

      const existingInst = await db.collection('instituicoes').findOne({ nome: instituicao_nome });
      if (existingInst) {
        const hasGestor = await db.collection('usuarios').findOne({ entidade_id: existingInst._id.toString(), entidade_tipo: 'instituicao', is_gestor: true });
        if (hasGestor) return res.status(400).json({ error: 'Esta instituição já tem um gestor atribuído.' });

        const result = await db.collection('usuarios').insertOne({
          username, password: hashedPassword, perfil, nome: nome || null, email: email || null,
          telefone: telefone || null, is_gestor: true, entidade_id: existingInst._id.toString(),
          entidade_tipo: 'instituicao', aprovado: false, foto: null, created_at: new Date()
        });
        return res.status(201).json({ message: 'Solicitação de reivindicação enviada. Aguarde aprovação do administrador.', id: result.insertedId });
      }

      let municipio_id = null;
      if (instituicao_municipio) {
        const mun = await db.collection('municipios').findOne({ nome: instituicao_municipio });
        if (mun) municipio_id = mun._id.toString();
      }

      const instResult = await db.collection('instituicoes').insertOne({
        nome: instituicao_nome, tipo: instituicao_tipo || 'ensino_primario', municipio_id,
        email: email || null, telefone: telefone || null, endereco: null, latitude: null, longitude: null,
        vagas_totais: 0, vagas_disponiveis: 0, responsavel: null, logotipo_url: null, imagem_url: null,
        lema: null, descricao: null, aceita_inscricao_online: false, aceita_inscricao_presencial: true,
        taxa_inscricao: 0, taxa_matricula: 0, status: 'ativa', created_at: new Date()
      });

      const result = await db.collection('usuarios').insertOne({
        username, password: hashedPassword, perfil, nome: nome || null, email: email || null,
        telefone: telefone || null, is_gestor: true, entidade_id: instResult.insertedId.toString(),
        entidade_tipo: 'instituicao', aprovado: false, foto: null, created_at: new Date()
      });

      res.status(201).json({ message: 'Conta de instituição criada com sucesso. Aguarde aprovação do administrador.', id: result.insertedId });
    } else if (perfil === 'encarregado') {
      const result = await db.collection('usuarios').insertOne({
        username, password: hashedPassword, perfil, nome: nome || null, email: email || null,
        telefone: telefone || null, is_gestor: false, entidade_id: null, entidade_tipo: null,
        aprovado: true, foto: null, created_at: new Date()
      });
      const token = jwt.sign({ id: result.insertedId.toString(), username, perfil, is_gestor: false, entidade_id: null, entidade_tipo: null }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ message: 'Conta criada com sucesso', token, user: { id: result.insertedId.toString(), username, perfil } });
    } else if (perfil === 'admin') {
      const adminCount = await db.collection('usuarios').countDocuments({ perfil: 'admin' });
      if (adminCount > 0) return res.status(400).json({ error: 'Já existe um administrador no sistema' });

      const result = await db.collection('usuarios').insertOne({
        username, password: hashedPassword, perfil, nome: nome || null, email: email || null,
        telefone: null, is_gestor: false, entidade_id: null, entidade_tipo: null,
        aprovado: true, foto: null, created_at: new Date()
      });
      const token = jwt.sign({ id: result.insertedId.toString(), username, perfil, is_gestor: false, entidade_id: null, entidade_tipo: null }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ message: 'Conta de administrador criada com sucesso', token, user: { id: result.insertedId.toString(), username, perfil } });
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const uploadFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    const fotoPath = `/uploads/fotos/${req.file.filename}`;
    const db = getDB();
    await db.collection('usuarios').updateOne({ _id: new ObjectId(req.user.id) }, { $set: { foto: fotoPath } });
    res.json({ foto: fotoPath, message: 'Foto atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
};

const getPerfilCompleto = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

    let dadosVinculados = {};

    if (user.perfil === 'admin') {
      const [totalInstituicoes, totalAlunos, totalProfessores, totalTurmas, usuarios, vagas] = await Promise.all([
        db.collection('instituicoes').countDocuments(),
        db.collection('alunos').countDocuments(),
        db.collection('professores').countDocuments(),
        db.collection('turmas').countDocuments(),
        db.collection('usuarios').countDocuments(),
        db.collection('instituicoes').aggregate([{ $group: { _id: null, total: { $sum: '$vagas_totais' }, disponiveis: { $sum: '$vagas_disponiveis' } } }]).toArray()
      ]);
      dadosVinculados = {
        total_instituicoes: totalInstituicoes, total_alunos: totalAlunos,
        total_professores: totalProfessores, total_turmas: totalTurmas,
        total_vagas: vagas[0]?.total || 0, vagas_disponiveis: vagas[0]?.disponiveis || 0,
        total_usuarios: usuarios
      };
    } else if (user.perfil === 'instituicao' && user.entidade_id) {
      const [professores, alunos, turmas, vagas, solicitacoes] = await Promise.all([
        db.collection('professores').find({ instituicao_id: user.entidade_id }).project({ nome_completo: 1, especialidade: 1, estado: 1 }).toArray(),
        db.collection('alunos').find({ instituicao_id: user.entidade_id }).project({ nome_completo: 1, numero_estudante: 1, estado: 1 }).toArray(),
        db.collection('turmas').find({ instituicao_id: user.entidade_id }).project({ nome: 1, nivel: 1, vagas: 1, vagas_ocupadas: 1 }).toArray(),
        db.collection('instituicoes').findOne({ _id: new ObjectId(user.entidade_id) }, { projection: { vagas_totais: 1, vagas_disponiveis: 1 } }),
        db.collection('solicitacoes').countDocuments({ instituicao_id: user.entidade_id, estado: 'pendente' })
      ]);
      dadosVinculados = {
        professores, alunos, turmas,
        vagas_totais: vagas?.vagas_totais || 0, vagas_disponiveis: vagas?.vagas_disponiveis || 0,
        solicitacoes_pendentes: solicitacoes
      };
    } else if (user.perfil === 'encarregado' && user.entidade_id) {
      const [alunos, solicitacoes] = await Promise.all([
        db.collection('alunos').aggregate([
          { $match: { encarregado_id: user.entidade_id } },
          { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'inst' } },
          { $project: { nome_completo: 1, numero_estudante: 1, estado: 1, instituicao_nome: { $arrayElemAt: ['$inst.nome', 0] } } }
        ]).toArray(),
        db.collection('solicitacoes').aggregate([
          { $match: { encarregado_id: user.entidade_id } },
          { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'inst' } },
          { $project: { estado: 1, aluno_nome: 1, instituicao_nome: { $arrayElemAt: ['$inst.nome', 0] }, created_at: 1 } },
          { $sort: { created_at: -1 } }, { $limit: 5 }
        ]).toArray()
      ]);
      dadosVinculados = { alunos, solicitacoes };
    }

    const { password, ...userSafe } = user;
    res.json({ ...userSafe, id: user._id.toString(), dados_vinculados: dadosVinculados });
  } catch (error) {
    console.error('Erro ao buscar perfil completo:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

module.exports = { login, register, uploadFoto, getPerfilCompleto };
