const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getAlunos = async (req, res) => {
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
        { numero_estudante: { $regex: search, $options: 'i' } }
      ];
    }
    if (instituicao_id) {
      matchStage.instituicao_id = new ObjectId(instituicao_id);
    }
    if (estado) {
      matchStage.estado = estado;
    }

    const total = await db.collection('alunos').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { nome_completo: 1 } },
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
          from: 'encarregados',
          localField: 'encarregado_id',
          foreignField: '_id',
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          naturalidade: 1,
          numero_estudante: 1,
          encarregado_id: 1,
          instituicao_id: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          encarregado_nome: '$encarregado.nome_completo'
        }
      }
    ];

    const alunos = await db.collection('alunos').aggregate(pipeline).toArray();

    res.json({
      data: alunos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

const getAlunoById = async (req, res) => {
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
          from: 'encarregados',
          localField: 'encarregado_id',
          foreignField: '_id',
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          naturalidade: 1,
          numero_estudante: 1,
          encarregado_id: 1,
          instituicao_id: 1,
          estado: 1,
          telefone: 1,
          email: 1,
          morada: 1,
          bi: 1,
          grupo_sanguineo: 1,
          religiao: 1,
          contacto_emergencia_nome: 1,
          contacto_emergencia_telefone: 1,
          controlo_parental: 1,
          foto_url: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          encarregado_nome: '$encarregado.nome_completo',
          encarregado_telefone: '$encarregado.telefone'
        }
      }
    ];

    const result = await db.collection('alunos').aggregate(pipeline).toArray();
    if (result.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const aluno = result[0];

    const matriculas = await db.collection('matriculas').aggregate([
      { $match: { aluno_id: new ObjectId(id) } },
      { $sort: { ano_letivo: -1 } },
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
        $project: {
          _id: 1,
          aluno_id: 1,
          turma_id: 1,
          ano_letivo: 1,
          estado: 1,
          data_matricula: 1,
          created_at: 1,
          turma_nome: '$turma.nome',
          ano_letivo: '$turma.ano_letivo',
          nivel: '$turma.nivel'
        }
      }
    ]).toArray();

    const classificacoes = await db.collection('classificacoes')
      .find({ aluno_id: new ObjectId(id) })
      .sort({ classe_numero: -1, ano_letivo: -1 })
      .toArray();

    res.json({ ...aluno, matriculas, classificacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

const createAluno = async (req, res) => {
  try {
    const db = getDB();
    const {
      nome_completo, data_nascimento, sexo, naturalidade, numero_estudante,
      encarregado_id, instituicao_id,
      telefone, email, morada, bi, grupo_sanguineo, religiao,
      contacto_emergencia_nome, contacto_emergencia_telefone,
      controlo_parental, foto_url
    } = req.body;

    const existing = await db.collection('alunos').findOne({ numero_estudante });
    if (existing) {
      return res.status(400).json({ error: 'Número de estudante já existe' });
    }

    const result = await db.collection('alunos').insertOne({
      nome_completo,
      data_nascimento,
      sexo,
      naturalidade,
      numero_estudante,
      encarregado_id: encarregado_id ? new ObjectId(encarregado_id) : null,
      instituicao_id: new ObjectId(instituicao_id),
      telefone: telefone || '',
      email: email || '',
      morada: morada || '',
      bi: bi || '',
      grupo_sanguineo: grupo_sanguineo || '',
      religiao: religiao || '',
      contacto_emergencia_nome: contacto_emergencia_nome || '',
      contacto_emergencia_telefone: contacto_emergencia_telefone || '',
      controlo_parental: controlo_parental || {
        activo: false,
        permissoes: {},
        contactos_autorizados: []
      },
      foto_url: foto_url || null,
      estado: 'ativo',
      created_at: new Date()
    });

    await db.collection('instituicoes').updateOne(
      { _id: new ObjectId(instituicao_id) },
      { $inc: { total_alunos: 1 } }
    );

    res.status(201).json({ message: 'Aluno registado com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar aluno' });
  }
};

const updateAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      nome_completo, data_nascimento, sexo, naturalidade, numero_estudante,
      encarregado_id, instituicao_id, estado,
      telefone, email, morada, bi, grupo_sanguineo, religiao,
      contacto_emergencia_nome, contacto_emergencia_telefone,
      controlo_parental, foto_url
    } = req.body;

    const updateData = {
      nome_completo,
      data_nascimento,
      sexo,
      naturalidade,
      numero_estudante,
      encarregado_id: encarregado_id ? new ObjectId(encarregado_id) : null,
      instituicao_id: new ObjectId(instituicao_id),
      estado
    };

    if (telefone !== undefined) updateData.telefone = telefone;
    if (email !== undefined) updateData.email = email;
    if (morada !== undefined) updateData.morada = morada;
    if (bi !== undefined) updateData.bi = bi;
    if (grupo_sanguineo !== undefined) updateData.grupo_sanguineo = grupo_sanguineo;
    if (religiao !== undefined) updateData.religiao = religiao;
    if (contacto_emergencia_nome !== undefined) updateData.contacto_emergencia_nome = contacto_emergencia_nome;
    if (contacto_emergencia_telefone !== undefined) updateData.contacto_emergencia_telefone = contacto_emergencia_telefone;
    if (controlo_parental !== undefined) updateData.controlo_parental = controlo_parental;
    if (foto_url !== undefined) updateData.foto_url = foto_url;

    await db.collection('alunos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Aluno atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

const deleteAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const aluno = await db.collection('alunos').findOne({ _id: new ObjectId(id) });

    await db.collection('alunos').deleteOne({ _id: new ObjectId(id) });

    if (aluno && aluno.instituicao_id) {
      await db.collection('instituicoes').updateOne(
        { _id: aluno.instituicao_id },
        { $inc: { total_alunos: -1 } }
      );
    }

    res.json({ message: 'Aluno removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover aluno' });
  }
};

module.exports = {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno
};
