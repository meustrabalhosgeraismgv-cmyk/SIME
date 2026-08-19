const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { matchInstituicaoId } = require('../utils/filters');

const getDenuncias = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, estado = '', tipo = '', instituicao_id = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (estado) matchStage.estado = estado;
    if (tipo) matchStage.tipo = tipo;
    if (instituicao_id) matchStage.instituicao_id = matchInstituicaoId(instituicao_id);

    const total = await db.collection('denuncias').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'instituicoes',
          localField: 'instituicao_id',
          foreignField: '_id',
          as: 'instituicao'
        }
      },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          tipo: 1,
          assunto: 1,
          descricao: 1,
          local: 1,
          anonimo: 1,
          nome: 1,
          telefone: 1,
          email: 1,
          instituicao_id: 1,
          estado: 1,
          resposta: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome'
        }
      }
    ];

    const data = await db.collection('denuncias').aggregate(pipeline).toArray();

    res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ error: 'Erro ao listar denúncias' });
  }
};

const getDenunciaById = async (req, res) => {
  try {
    const db = getDB();
    const denuncia = await db.collection('denuncias').findOne({ _id: new ObjectId(req.params.id) });
    if (!denuncia) return res.status(404).json({ error: 'Denúncia não encontrada' });
    res.json(denuncia);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar denúncia' });
  }
};

const createDenuncia = async (req, res) => {
  try {
    const db = getDB();
    const { tipo, assunto, descricao, local, anonimo, nome, telefone, email, instituicao_id } = req.body;

    if (!assunto || !descricao) {
      return res.status(400).json({ error: 'Assunto e descrição são obrigatórios' });
    }

    const result = await db.collection('denuncias').insertOne({
      tipo: tipo || 'denuncia',
      assunto,
      descricao,
      local: local || '',
      anonimo: anonimo === true || anonimo === 1,
      nome: anonimo ? null : (nome || ''),
      telefone: anonimo ? null : (telefone || ''),
      email: anonimo ? null : (email || ''),
      instituicao_id: instituicao_id ? new ObjectId(instituicao_id) : null,
      estado: 'nova',
      resposta: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ id: result.insertedId.toString(), message: 'Denúncia registada' });
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
};

const updateDenuncia = async (req, res) => {
  try {
    const db = getDB();
    const { estado, resposta } = req.body;

    const updateData = {};
    if (estado !== undefined) updateData.estado = estado;
    if (resposta !== undefined) updateData.resposta = resposta;
    updateData.updated_at = new Date();

    await db.collection('denuncias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Denúncia atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar denúncia' });
  }
};

const deleteDenuncia = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('denuncias').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Denúncia removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover denúncia' });
  }
};

const getDenunciasStats = async (req, res) => {
  try {
    const db = getDB();
    const [total, novas, emAnalise, resolvidas, sos, denuncias] = await Promise.all([
      db.collection('denuncias').countDocuments(),
      db.collection('denuncias').countDocuments({ estado: 'nova' }),
      db.collection('denuncias').countDocuments({ estado: 'em_analise' }),
      db.collection('denuncias').countDocuments({ estado: 'resolvida' }),
      db.collection('denuncias').countDocuments({ tipo: 'sos' }),
      db.collection('denuncias').countDocuments({ tipo: 'denuncia' })
    ]);

    res.json({ total, novas, em_analise: emAnalise, resolvidas, sos, denuncias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

module.exports = {
  getDenuncias,
  getDenunciaById,
  createDenuncia,
  updateDenuncia,
  deleteDenuncia,
  getDenunciasStats
};
