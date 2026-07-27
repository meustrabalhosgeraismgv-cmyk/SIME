const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getMatriculas = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, turma_id = '', ano_letivo = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (turma_id) {
      matchStage.turma_id = new ObjectId(turma_id);
    }
    if (ano_letivo) {
      matchStage.ano_letivo = ano_letivo;
    }

    const total = await db.collection('matriculas').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { data_matricula: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'alunos',
          localField: 'aluno_id',
          foreignField: '_id',
          as: 'aluno'
        }
      },
      { $unwind: { path: '$aluno', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'turmas',
          localField: 'turma_id',
          foreignField: '_id',
          as: 'turma'
        }
      },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'instituicoes',
          localField: 'turma.instituicao_id',
          foreignField: '_id',
          as: 'instituicao'
        }
      },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          aluno_id: 1,
          turma_id: 1,
          ano_letivo: 1,
          estado: 1,
          data_matricula: 1,
          created_at: 1,
          aluno_nome: '$aluno.nome_completo',
          numero_estudante: '$aluno.numero_estudante',
          turma_nome: '$turma.nome',
          instituicao_nome: '$instituicao.nome'
        }
      }
    ];

    const matriculas = await db.collection('matriculas').aggregate(pipeline).toArray();

    res.json({
      data: matriculas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar matrículas' });
  }
};

const createMatricula = async (req, res) => {
  try {
    const db = getDB();
    const { aluno_id, turma_id, ano_letivo } = req.body;

    const existingMatricula = await db.collection('matriculas').findOne({
      aluno_id: new ObjectId(aluno_id),
      turma_id: new ObjectId(turma_id),
      ano_letivo,
      estado: 'ativa'
    });

    if (existingMatricula) {
      return res.status(400).json({ error: 'Aluno já matriculado nesta turma' });
    }

    const turma = await db.collection('turmas').findOne({ _id: new ObjectId(turma_id) });
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    if ((turma.vagas_ocupadas || 0) >= (turma.vagas || 0)) {
      return res.status(400).json({ error: 'Turma sem vagas disponíveis' });
    }

    const result = await db.collection('matriculas').insertOne({
      aluno_id: new ObjectId(aluno_id),
      turma_id: new ObjectId(turma_id),
      ano_letivo,
      estado: 'ativa',
      data_matricula: new Date(),
      created_at: new Date()
    });

    await db.collection('turmas').updateOne(
      { _id: new ObjectId(turma_id) },
      { $inc: { vagas_ocupadas: 1 } }
    );

    await db.collection('instituicoes').updateOne(
      { _id: turma.instituicao_id },
      { $inc: { vagas_disponiveis: -1 } }
    );

    res.status(201).json({ message: 'Matrícula realizada com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar matrícula' });
  }
};

const cancelMatricula = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const matricula = await db.collection('matriculas').findOne({ _id: new ObjectId(id) });
    if (!matricula) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    await db.collection('matriculas').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'cancelada' } }
    );

    await db.collection('turmas').updateOne(
      { _id: matricula.turma_id },
      { $inc: { vagas_ocupadas: -1 } }
    );

    const turma = await db.collection('turmas').findOne({ _id: matricula.turma_id });
    if (turma) {
      await db.collection('instituicoes').updateOne(
        { _id: turma.instituicao_id },
        { $inc: { vagas_disponiveis: 1 } }
      );
    }

    res.json({ message: 'Matrícula cancelada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar matrícula' });
  }
};

module.exports = {
  getMatriculas,
  createMatricula,
  cancelMatricula
};
