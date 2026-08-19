const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getEncarregados = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { nome_completo: { $regex: search, $options: 'i' } },
        { bi: { $regex: search, $options: 'i' } },
        { telefone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('encarregados').countDocuments(matchStage);

    const encarregados = await db.collection('encarregados')
      .find(matchStage)
      .sort({ nome_completo: 1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.json({
      data: encarregados.map(e => ({ ...e, id: e._id.toString() })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar encarregados' });
  }
};

const getEncarregadoById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const encarregado = await db.collection('encarregados').findOne({ _id: new ObjectId(id) });
    if (!encarregado) {
      return res.status(404).json({ error: 'Encarregado não encontrado' });
    }

    const alunos = await db.collection('alunos').aggregate([
      { $match: { encarregado_id: new ObjectId(id) } },
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
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          naturalidade: 1,
          numero_estudante: 1,
          instituicao_id: 1,
          estado: 1,
          instituicao_nome: '$instituicao.nome'
        }
      }
    ]).toArray();

    res.json({ ...encarregado, id: encarregado._id.toString(), alunos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar encarregado' });
  }
};

const createEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const { nome_completo, bi, telefone, email, endereco, profissao } = req.body;

    const existing = await db.collection('encarregados').findOne({ bi });
    if (existing) {
      return res.status(400).json({ error: 'BI já cadastrado' });
    }

    const result = await db.collection('encarregados').insertOne({
      nome_completo,
      bi,
      telefone,
      email,
      endereco,
      profissao,
      created_at: new Date()
    });

    res.status(201).json({ message: 'Encarregado registado com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar encarregado' });
  }
};

const updateEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { nome_completo, bi, telefone, email, endereco, profissao } = req.body;

    await db.collection('encarregados').updateOne(
      { _id: new ObjectId(id) },
      { $set: { nome_completo, bi, telefone, email, endereco, profissao } }
    );

    res.json({ message: 'Encarregado atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar encarregado' });
  }
};

const deleteEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    await db.collection('encarregados').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Encarregado removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover encarregado' });
  }
};

module.exports = {
  getEncarregados,
  getEncarregadoById,
  createEncarregado,
  updateEncarregado,
  deleteEncarregado
};
