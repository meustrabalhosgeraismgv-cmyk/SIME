const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getNoticias = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, categoria = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { publicada: true };
    if (categoria) {
      matchStage.categoria = categoria;
    }

    const total = await db.collection('noticias').countDocuments(matchStage);

    const noticias = await db.collection('noticias')
      .find(matchStage)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.json({
      data: noticias,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
};

const getNoticiasDestaque = async (req, res) => {
  try {
    const db = getDB();

    const noticias = await db.collection('noticias')
      .find({ publicada: true, destaque: true })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias em destaque' });
  }
};

const getNoticiaById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const noticia = await db.collection('noticias').findOne({
      _id: new ObjectId(id),
      publicada: true
    });

    if (!noticia) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícia' });
  }
};

module.exports = {
  getNoticias,
  getNoticiasDestaque,
  getNoticiaById
};
