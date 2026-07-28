const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION = 'instituicoes';

const getInstituicoes = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, search = '', tipo = '', municipio_id = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const typeMatch = {};
    if (tipo) typeMatch.tipo = tipo;
    if (municipio_id) typeMatch.municipio_id = municipio_id;

    const pipeline = [
      { $match: typeMatch },
      {
        $addFields: {
          municipio_id_obj: { $toObjectId: '$municipio_id' },
          latitude: { $ifNull: ['$latitude', '$lat'] },
          longitude: { $ifNull: ['$longitude', '$lng'] },
          vagas_totais: { $ifNull: ['$vagas_totais', '$vt'] },
          vagas_disponiveis: { $ifNull: ['$vagas_disponiveis', '$vd'] },
          responsavel: { $ifNull: ['$responsavel', '$dir'] },
          telefone: { $ifNull: ['$telefone', '$tel'] },
        }
      },
      {
        $lookup: {
          from: 'municipios',
          localField: 'municipio_id_obj',
          foreignField: '_id',
          as: 'municipio'
        }
      },
      { $unwind: { path: '$municipio', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'provincias',
          localField: 'municipio.provincia_id',
          foreignField: '_id',
          as: 'provincia'
        }
      },
      { $unwind: { path: '$provincia', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          municipio_nome: { $ifNull: ['$municipio.nome', '$mun'] },
          provincia_nome: '$provincia.nome'
        }
      },
      ...(search ? [{ $match: {
        $or: [
          { nome: { $regex: search, $options: 'i' } },
          { municipio_nome: { $regex: search, $options: 'i' } },
          { tipo: { $regex: search, $options: 'i' } }
        ]
      }}] : []),
      { $project: { municipio: 0, provincia: 0, municipio_id_obj: 0, mun: 0, vt: 0, vd: 0, dir: 0, lat: 0, lng: 0, tel: 0 } },
      { $sort: { nome: 1 } },
      { $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const [result] = await db.collection(COLLECTION).aggregate(pipeline).toArray();
    const total = result.total[0]?.count || 0;

    res.json({
      data: result.data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar instituições' });
  }
};

const getInstituicaoById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $addFields: {
          municipio_id_obj: { $toObjectId: '$municipio_id' },
          latitude: { $ifNull: ['$latitude', '$lat'] },
          longitude: { $ifNull: ['$longitude', '$lng'] },
          vagas_totais: { $ifNull: ['$vagas_totais', '$vt'] },
          vagas_disponiveis: { $ifNull: ['$vagas_disponiveis', '$vd'] },
          responsavel: { $ifNull: ['$responsavel', '$dir'] },
          telefone: { $ifNull: ['$telefone', '$tel'] },
        }
      },
      {
        $lookup: {
          from: 'municipios',
          localField: 'municipio_id_obj',
          foreignField: '_id',
          as: 'municipio'
        }
      },
      { $unwind: { path: '$municipio', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'provincias',
          localField: 'municipio.provincia_id',
          foreignField: '_id',
          as: 'provincia'
        }
      },
      { $unwind: { path: '$provincia', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          municipio_nome: { $ifNull: ['$municipio.nome', '$mun'] },
          provincia_nome: '$provincia.nome'
        }
      },
      { $project: { municipio: 0, provincia: 0, municipio_id_obj: 0, mun: 0, vt: 0, vd: 0, dir: 0, lat: 0, lng: 0, tel: 0 } }
    ];

    const [instituicao] = await db.collection(COLLECTION).aggregate(pipeline).toArray();

    if (!instituicao) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }

    res.json(instituicao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar instituição' });
  }
};

const createInstituicao = async (req, res) => {
  try {
    const db = getDB();
    const { nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, latitude, longitude } = req.body;

    const doc = {
      nome,
      tipo,
      endereco,
      telefone,
      email,
      municipio_id: municipio_id ? new ObjectId(municipio_id) : null,
      vagas_totais,
      vagas_disponiveis: vagas_totais,
      latitude: latitude || null,
      longitude: longitude || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(doc);

    res.status(201).json({ message: 'Instituição criada com sucesso', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar instituição' });
  }
};

const updateInstituicao = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { nome, tipo, endereco, telefone, email, municipio_id, vagas_totais, vagas_disponiveis, status, latitude, longitude } = req.body;

    const update = {
      $set: {
        nome,
        tipo,
        endereco,
        telefone,
        email,
        municipio_id: municipio_id ? new ObjectId(municipio_id) : null,
        vagas_totais,
        vagas_disponiveis: vagas_disponiveis || vagas_totais,
        status,
        latitude: latitude || null,
        longitude: longitude || null,
        updated_at: new Date()
      }
    };

    await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, update);

    res.json({ message: 'Instituição atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar instituição' });
  }
};

const deleteInstituicao = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Instituição removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover instituição' });
  }
};

const getEstatisticasInstituicao = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const objId = new ObjectId(id);

    const [instituicao, totalAlunos, totalProfessores, totalTurmas] = await Promise.all([
      db.collection(COLLECTION).findOne({ _id: objId }),
      db.collection('alunos').countDocuments({ instituicao_id: objId }),
      db.collection('professores').countDocuments({ instituicao_id: objId }),
      db.collection('turmas').countDocuments({ instituicao_id: objId })
    ]);

    const vagas_totais = instituicao?.vagas_totais || 0;
    const vagas_disponiveis = instituicao?.vagas_disponiveis || 0;

    res.json({
      total_alunos: totalAlunos,
      total_professores: totalProfessores,
      total_turmas: totalTurmas,
      vagas_totais,
      vagas_disponiveis,
      ocupacao: vagas_totais ? ((vagas_totais - vagas_disponiveis) / vagas_totais * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  getInstituicoes,
  getInstituicaoById,
  createInstituicao,
  updateInstituicao,
  deleteInstituicao,
  getEstatisticasInstituicao
};
