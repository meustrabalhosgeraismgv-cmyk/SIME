const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getTurmas = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, instituicao_id = '', ano_letivo = '', nivel = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (instituicao_id) {
      matchStage.instituicao_id = new ObjectId(instituicao_id);
    }
    if (ano_letivo) {
      matchStage.ano_letivo = ano_letivo;
    }
    if (nivel) {
      matchStage.nivel = nivel;
    }

    const total = await db.collection('turmas').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { ano_letivo: -1, nome: 1 } },
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
        $lookup: {
          from: 'professores',
          localField: 'professor_titular_id',
          foreignField: '_id',
          as: 'professor'
        }
      },
      { $unwind: { path: '$professor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome: 1,
          ano_letivo: 1,
          nivel: 1,
          instituicao_id: 1,
          professor_titular_id: 1,
          vagas: 1,
          vagas_ocupadas: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          professor_nome: '$professor.nome_completo'
        }
      }
    ];

    const turmas = await db.collection('turmas').aggregate(pipeline).toArray();

    res.json({
      data: turmas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar turmas' });
  }
};

const getTurmaById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
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
        $lookup: {
          from: 'professores',
          localField: 'professor_titular_id',
          foreignField: '_id',
          as: 'professor'
        }
      },
      { $unwind: { path: '$professor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome: 1,
          ano_letivo: 1,
          nivel: 1,
          instituicao_id: 1,
          professor_titular_id: 1,
          vagas: 1,
          vagas_ocupadas: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          professor_nome: '$professor.nome_completo'
        }
      }
    ];

    const result = await db.collection('turmas').aggregate(pipeline).toArray();
    if (result.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    const turma = result[0];

    const alunos = await db.collection('alunos').aggregate([
      {
        $lookup: {
          from: 'matriculas',
          let: { alunoId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$aluno_id', '$$alunoId'] }, { $eq: ['$turma_id', new ObjectId(id)] }, { $eq: ['$estado', 'ativa'] }] } } }
          ],
          as: 'matricula'
        }
      },
      { $unwind: { path: '$matricula', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          numero_estudante: 1,
          estado: 1,
          matricula_estado: { $arrayElemAt: ['$matricula.estado', 0] }
        }
      },
      { $sort: { nome_completo: 1 } }
    ]).toArray();

    res.json({ ...turma, alunos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar turma' });
  }
};

const createTurma = async (req, res) => {
  try {
    const db = getDB();
    const { nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas } = req.body;

    const result = await db.collection('turmas').insertOne({
      nome,
      ano_letivo,
      nivel,
      instituicao_id: new ObjectId(instituicao_id),
      professor_titular_id: professor_titular_id ? new ObjectId(professor_titular_id) : null,
      vagas,
      vagas_ocupadas: 0,
      estado: 'ativa',
      created_at: new Date()
    });

    res.status(201).json({ message: 'Turma criada com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar turma' });
  }
};

const updateTurma = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas } = req.body;

    const updateData = {
      nome,
      ano_letivo,
      nivel,
      instituicao_id: new ObjectId(instituicao_id),
      professor_titular_id: professor_titular_id ? new ObjectId(professor_titular_id) : null,
      vagas
    };

    await db.collection('turmas').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Turma atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
};

const deleteTurma = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    await db.collection('turmas').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Turma removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover turma' });
  }
};

module.exports = {
  getTurmas,
  getTurmaById,
  createTurma,
  updateTurma,
  deleteTurma
};
