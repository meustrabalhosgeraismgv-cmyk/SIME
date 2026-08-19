const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { matchInstituicaoId, lookupInstituicao } = require('../utils/filters');

const getProfessores = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, search = '', instituicao_id = '', estado = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { nome_completo: { $regex: search, $options: 'i' } },
        { numero_funcionario: { $regex: search, $options: 'i' } }
      ];
    }
    if (instituicao_id) {
      matchStage.instituicao_id = matchInstituicaoId(instituicao_id);
    }
    if (estado) {
      matchStage.estado = estado;
    }

    const total = await db.collection('professores').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { nome_completo: 1 } },
      { $skip: skip },
      { $limit: limitNum },
      lookupInstituicao('instituicao_id', 'instituicao'),
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          bi: 1,
          data_nascimento: 1,
          telefone: 1,
          email: 1,
          formacao: 1,
          especialidade: 1,
          numero_funcionario: 1,
          instituicao_id: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome'
        }
      }
    ];

    const professores = await db.collection('professores').aggregate(pipeline).toArray();

    res.json({
      data: professores,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professores' });
  }
};

const getProfessorById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      lookupInstituicao('instituicao_id', 'instituicao'),
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          bi: 1,
          data_nascimento: 1,
          telefone: 1,
          email: 1,
          formacao: 1,
          especialidade: 1,
          numero_funcionario: 1,
          instituicao_id: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome'
        }
      }
    ];

    const result = await db.collection('professores').aggregate(pipeline).toArray();
    if (result.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    const professor = result[0];

    const turmas = await db.collection('turmas')
      .find({ professor_titular_id: new ObjectId(id) })
      .sort({ ano_letivo: -1 })
      .toArray();

    res.json({ ...professor, turmas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professor' });
  }
};

const createProfessor = async (req, res) => {
  try {
    const db = getDB();
    const { nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id } = req.body;

    const existing = await db.collection('professores').findOne({
      $or: [{ bi }, { numero_funcionario }]
    });
    if (existing) {
      return res.status(400).json({ error: 'BI ou número de funcionário já existe' });
    }

    const result = await db.collection('professores').insertOne({
      nome_completo,
      bi,
      data_nascimento,
      telefone,
      email,
      formacao,
      especialidade,
      numero_funcionario,
      instituicao_id: new ObjectId(instituicao_id),
      estado: 'ativo',
      created_at: new Date()
    });

    await db.collection('instituicoes').updateOne(
      { _id: new ObjectId(instituicao_id) },
      { $inc: { total_professores: 1 } }
    );

    res.status(201).json({ message: 'Professor registado com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar professor' });
  }
};

const updateProfessor = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id, estado } = req.body;

    const updateData = {
      nome_completo,
      bi,
      data_nascimento,
      telefone,
      email,
      formacao,
      especialidade,
      numero_funcionario,
      instituicao_id: new ObjectId(instituicao_id),
      estado
    };

    await db.collection('professores').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Professor atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
};

const deleteProfessor = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const professor = await db.collection('professores').findOne({ _id: new ObjectId(id) });

    await db.collection('professores').deleteOne({ _id: new ObjectId(id) });

    if (professor && professor.instituicao_id) {
      await db.collection('instituicoes').updateOne(
        { _id: professor.instituicao_id },
        { $inc: { total_professores: -1 } }
      );
    }

    res.json({ message: 'Professor removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover professor' });
  }
};

module.exports = {
  getProfessores,
  getProfessorById,
  createProfessor,
  updateProfessor,
  deleteProfessor
};
