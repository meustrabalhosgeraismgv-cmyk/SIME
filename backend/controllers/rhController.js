const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getFuncionarios = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '', instituicao_id = '', estado = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { nome_completo: { $regex: search, $options: 'i' } },
        { numero_funcionario: { $regex: search, $options: 'i' } },
        { cargo: { $regex: search, $options: 'i' } }
      ];
    }
    if (instituicao_id) matchStage.instituicao_id = new ObjectId(instituicao_id);
    if (estado) matchStage.estado = estado;

    const total = await db.collection('funcionarios').countDocuments(matchStage);

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
          from: 'avaliacoes_desempenho',
          localField: '_id',
          foreignField: 'funcionario_id',
          as: 'avaliacoes'
        }
      },
      {
        $project: {
          _id: 1,
          nome_completo: 1,
          bi: 1,
          data_nascimento: 1,
          telefone: 1,
          email: 1,
          cargo: 1,
          departamento: 1,
          formacao: 1,
          especialidade: 1,
          numero_funcionario: 1,
          instituicao_id: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          total_avaliacoes: { $size: '$avaliacoes' },
          ultima_classificacao: { $arrayElemAt: ['$avaliacoes.classificacao', -1] }
        }
      }
    ];

    const data = await db.collection('funcionarios').aggregate(pipeline).toArray();

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
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro ao listar funcionários' });
  }
};

const getFuncionarioById = async (req, res) => {
  try {
    const db = getDB();
    const pipeline = [
      { $match: { _id: new ObjectId(req.params.id) } },
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
          from: 'avaliacoes_desempenho',
          localField: '_id',
          foreignField: 'funcionario_id',
          as: 'avaliacoes'
        }
      },
      { $project: { instituicao: 0 } }
    ];

    const [funcionario] = await db.collection('funcionarios').aggregate(pipeline).toArray();
    if (!funcionario) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(funcionario);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar funcionário' });
  }
};

const createFuncionario = async (req, res) => {
  try {
    const db = getDB();
    const {
      nome_completo, bi, data_nascimento, telefone, email, cargo, departamento,
      formacao, especialidade, numero_funcionario, instituicao_id
    } = req.body;

    if (!nome_completo || !numero_funcionario) {
      return res.status(400).json({ error: 'Nome completo e número de funcionário são obrigatórios' });
    }

    const existing = await db.collection('funcionarios').findOne({
      $or: [{ bi: bi || '__none__' }, { numero_funcionario }]
    });
    if (existing) {
      return res.status(400).json({ error: 'BI ou número de funcionário já existe' });
    }

    const result = await db.collection('funcionarios').insertOne({
      nome_completo,
      bi: bi || '',
      data_nascimento: data_nascimento || null,
      telefone: telefone || '',
      email: email || '',
      cargo: cargo || 'Docente',
      departamento: departamento || '',
      formacao: formacao || '',
      especialidade: especialidade || '',
      numero_funcionario,
      instituicao_id: instituicao_id ? new ObjectId(instituicao_id) : null,
      estado: 'ativo',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ id: result.insertedId.toString(), message: 'Funcionário registado' });
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
};

const updateFuncionario = async (req, res) => {
  try {
    const db = getDB();
    const {
      nome_completo, bi, data_nascimento, telefone, email, cargo, departamento,
      formacao, especialidade, numero_funcionario, estado
    } = req.body;

    const updateData = {
      nome_completo,
      bi: bi || '',
      data_nascimento: data_nascimento || null,
      telefone: telefone || '',
      email: email || '',
      cargo: cargo || 'Docente',
      departamento: departamento || '',
      formacao: formacao || '',
      especialidade: especialidade || '',
      numero_funcionario,
      estado,
      updated_at: new Date()
    };

    await db.collection('funcionarios').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Funcionário atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
};

const deleteFuncionario = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('funcionarios').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Funcionário removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover funcionário' });
  }
};

const getRhStats = async (req, res) => {
  try {
    const db = getDB();
    const [total, ativos, afastados, aposentados, docentes, naoDocentes, totalAvaliacoes] = await Promise.all([
      db.collection('funcionarios').countDocuments(),
      db.collection('funcionarios').countDocuments({ estado: 'ativo' }),
      db.collection('funcionarios').countDocuments({ estado: 'afastado' }),
      db.collection('funcionarios').countDocuments({ estado: 'aposentado' }),
      db.collection('funcionarios').countDocuments({ cargo: { $regex: /docente|professor/i } }),
      db.collection('funcionarios').countDocuments({ cargo: { $not: { $regex: /docente|professor/i } } }),
      db.collection('avaliacoes_desempenho').countDocuments()
    ]);

    res.json({ total, ativos, afastados, aposentados, docentes, naoDocentes, total_avaliacoes: totalAvaliacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas RH' });
  }
};

const getAvaliacoes = async (req, res) => {
  try {
    const db = getDB();
    const { funcionario_id = '', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (funcionario_id) matchStage.funcionario_id = new ObjectId(funcionario_id);

    const total = await db.collection('avaliacoes_desempenho').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { periodo_inicio: -1, created_at: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'funcionarios',
          localField: 'funcionario_id',
          foreignField: '_id',
          as: 'funcionario'
        }
      },
      { $unwind: { path: '$funcionario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          funcionario_id: 1,
          periodo_inicio: 1,
          periodo_fim: 1,
          criterios: 1,
          pontuacao_total: 1,
          pontuacao_maxima: 1,
          classificacao: 1,
          observacoes: 1,
          avaliador: 1,
          created_at: 1,
          funcionario_nome: '$funcionario.nome_completo'
        }
      }
    ];

    const data = await db.collection('avaliacoes_desempenho').aggregate(pipeline).toArray();

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
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
};

const createAvaliacao = async (req, res) => {
  try {
    const db = getDB();
    const { funcionario_id, periodo_inicio, periodo_fim, criterios, pontuacao_total, pontuacao_maxima, classificacao, observacoes } = req.body;

    if (!funcionario_id || !periodo_inicio) {
      return res.status(400).json({ error: 'Funcionário e período são obrigatórios' });
    }

    const result = await db.collection('avaliacoes_desempenho').insertOne({
      funcionario_id: new ObjectId(funcionario_id),
      periodo_inicio: new Date(periodo_inicio),
      periodo_fim: periodo_fim ? new Date(periodo_fim) : null,
      criterios: criterios || {},
      pontuacao_total: pontuacao_total || 0,
      pontuacao_maxima: pontuacao_maxima || 0,
      classificacao: classificacao || 'Suficiente',
      observacoes: observacoes || '',
      avaliador: req.user.username,
      created_at: new Date()
    });

    res.status(201).json({ id: result.insertedId.toString(), message: 'Avaliação registada' });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
};

const updateAvaliacao = async (req, res) => {
  try {
    const db = getDB();
    const { periodo_inicio, periodo_fim, criterios, pontuacao_total, pontuacao_maxima, classificacao, observacoes } = req.body;

    const updateData = {};
    if (periodo_inicio !== undefined) updateData.periodo_inicio = new Date(periodo_inicio);
    if (periodo_fim !== undefined) updateData.periodo_fim = periodo_fim ? new Date(periodo_fim) : null;
    if (criterios !== undefined) updateData.criterios = criterios;
    if (pontuacao_total !== undefined) updateData.pontuacao_total = pontuacao_total;
    if (pontuacao_maxima !== undefined) updateData.pontuacao_maxima = pontuacao_maxima;
    if (classificacao !== undefined) updateData.classificacao = classificacao;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    await db.collection('avaliacoes_desempenho').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Avaliação atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
};

const deleteAvaliacao = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('avaliacoes_desempenho').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Avaliação removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover avaliação' });
  }
};

module.exports = {
  getFuncionarios,
  getFuncionarioById,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  getRhStats,
  getAvaliacoes,
  createAvaliacao,
  updateAvaliacao,
  deleteAvaliacao
};
