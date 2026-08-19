const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { matchInstituicaoId } = require('../utils/filters');

const CATEGORIAS = {
  noticia: 'Notícias',
  aviso_publicidade: 'Avisos e Publicidades',
  edital_licenca: 'Editais para Licenças',
  visita: 'Visitas',
  potencialidade: 'Potencialidades',
  geral: 'Geral'
};

const getDocumentos = async (req, res) => {
  try {
    const db = getDB();
    const { categoria = '', instituicao_id = '', page = 1, limit = 20, search = '', incluir_pendentes = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (categoria) matchStage.categoria = categoria;
    if (instituicao_id) matchStage.instituicao_id = matchInstituicaoId(instituicao_id);
    if (search) {
      matchStage.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descricao: { $regex: search, $options: 'i' } }
      ];
    }
    if (incluir_pendentes !== '1' || !req.user) matchStage.publicado = 1;

    const total = await db.collection('documentos').countDocuments(matchStage);

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
          titulo: 1,
          descricao: 1,
          categoria: 1,
          categoria_label: 1,
          referencia: 1,
          numero: 1,
          ficheiro_url: 1,
          imagem_url: 1,
          instituicao_id: 1,
          autor: 1,
          publicado: 1,
          data_documento: 1,
          created_at: 1,
          instituicao_nome: { $ifNull: ['$instituicao.nome', null] }
        }
      }
    ];

    const documentos = await db.collection('documentos').aggregate(pipeline).toArray();

    res.json({
      data: documentos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
};

const getDocumentoById = async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documentos').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar documento' });
  }
};

const getCategorias = (req, res) => {
  res.json({
    data: Object.entries(CATEGORIAS).map(([id, label]) => ({ id, label }))
  });
};

const createDocumento = async (req, res) => {
  try {
    const db = getDB();
    const { titulo, descricao, categoria, referencia, numero, ficheiro_url, imagem_url, instituicao_id, data_documento } = req.body;

    if (!titulo || !categoria) {
      return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
    }

    const result = await db.collection('documentos').insertOne({
      titulo,
      descricao: descricao || '',
      categoria,
      categoria_label: CATEGORIAS[categoria] || categoria,
      referencia: referencia || '',
      numero: numero || '',
      ficheiro_url: ficheiro_url || null,
      imagem_url: imagem_url || null,
      instituicao_id: instituicao_id ? (ObjectId.isValid(instituicao_id) ? new ObjectId(instituicao_id) : instituicao_id) : (req.user.entidade_id && ObjectId.isValid(req.user.entidade_id) ? new ObjectId(req.user.entidade_id) : null),
      publicado: req.user.perfil === 'admin' ? 1 : 0,
      autor: req.user.username,
      data_documento: data_documento || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ id: result.insertedId.toString(), message: 'Documento criado' });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ error: 'Erro ao criar documento' });
  }
};

const updateDocumento = async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documentos').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

    const isAdmin = req.user.perfil === 'admin';
    if (!isAdmin) {
      const owner = doc.instituicao_id && req.user.entidade_id && String(doc.instituicao_id) === String(req.user.entidade_id);
      if (!owner) return res.status(403).json({ error: 'Sem permissão para editar este documento' });
    }

    const { titulo, descricao, categoria, referencia, numero, ficheiro_url, imagem_url, instituicao_id, data_documento, publicado } = req.body;

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (categoria !== undefined) {
      updateData.categoria = categoria;
      updateData.categoria_label = CATEGORIAS[categoria] || categoria;
    }
    if (referencia !== undefined) updateData.referencia = referencia;
    if (numero !== undefined) updateData.numero = numero;
    if (ficheiro_url !== undefined) updateData.ficheiro_url = ficheiro_url;
    if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
    if (instituicao_id !== undefined) updateData.instituicao_id = instituicao_id ? (ObjectId.isValid(instituicao_id) ? new ObjectId(instituicao_id) : instituicao_id) : null;
    if (data_documento !== undefined) updateData.data_documento = data_documento;
    if (publicado !== undefined && isAdmin) updateData.publicado = (publicado === 1 || publicado === '1') ? 1 : 0;
    updateData.updated_at = new Date();

    await db.collection('documentos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Documento atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar documento' });
  }
};

const deleteDocumento = async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documentos').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

    const isAdmin = req.user.perfil === 'admin';
    if (!isAdmin) {
      const owner = doc.instituicao_id && req.user.entidade_id && String(doc.instituicao_id) === String(req.user.entidade_id);
      if (!owner) return res.status(403).json({ error: 'Sem permissão para eliminar este documento' });
    }

    await db.collection('documentos').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Documento removido' });
  } catch (error) {
    console.error('Erro ao remover documento:', error);
    res.status(500).json({ error: 'Erro ao remover documento' });
  }
};

module.exports = {
  getDocumentos,
  getDocumentoById,
  getCategorias,
  createDocumento,
  updateDocumento,
  deleteDocumento
};
