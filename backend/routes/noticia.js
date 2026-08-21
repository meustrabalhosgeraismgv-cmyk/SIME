const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { oid, matchInstituicaoId } = require('../utils/filters');

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { instituicao_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filter = { publicada: 1 };

    if (instituicao_id) {
      filter.instituicao_id = matchInstituicaoId(instituicao_id);
    }

    const noticias = await db.collection('noticias').aggregate([
      { $match: filter },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { id: { $toString: '$_id' }, instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: parseInt(limit) }
    ]).toArray();

    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

router.get('/gestor', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const instituicaoId = usuario?.entidade_id;

    const noticias = await db.collection('noticias').aggregate([
      { $match: { instituicao_id: matchInstituicaoId(instituicaoId) } },
      { $addFields: { id: { $toString: '$_id' } } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

router.get('/admin/pendentes', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const noticias = await db.collection('noticias').aggregate([
      { $match: { publicada: { $in: [0, -1] } } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { id: { $toString: '$_id' }, instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();
    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias pendentes' });
  }
});

router.get('/admin/todas', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const noticias = await db.collection('noticias').aggregate([
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $addFields: { id: { $toString: '$_id' }, instituicao_nome: '$instituicao.nome' } },
      { $project: { instituicao: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();
    res.json({ data: noticias });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

router.put('/:id/aprovar', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const result = await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { publicada: 1, data_aprovacao: new Date(), updated_at: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Notícia não encontrada' });
    res.json({ message: 'Notícia aprovada e publicada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id/rejeitar', authenticateToken, async (req, res) => {
  try {
    if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
    const db = getDB();
    const result = await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { publicada: -1, motivo_rejeicao: req.body.motivo || '', updated_at: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Notícia não encontrada' });
    res.json({ message: 'Notícia rejeitada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/destaque', async (req, res) => {
  try {
    const db = getDB();
    const noticias = await db.collection('noticias')
      .find({ publicada: 1, destaque: 1 })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar destaque' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const noticia = await db.collection('noticias').findOne({ _id: new ObjectId(req.params.id) });
    if (!noticia) return res.status(404).json({ error: 'Não encontrada' });
    noticia.id = noticia._id.toString();
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, resumo, conteudo, categoria, imagem_url, instituicao_id, destaque, videos } = req.body;
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });

    const ehAdmin = req.user.perfil === 'admin';
    const ehGestor = req.user.perfil === 'instituicao';
    const donoId = usuario?.entidade_id || null;

    if (ehGestor && !donoId) {
      return res.status(400).json({ error: 'Conta não vinculada a nenhuma instituição' });
    }

    const videosNorm = Array.isArray(videos) ? videos.filter(v => v && v.url).map(v => ({
      url: v.url,
      titulo: v.titulo || '',
      plataforma: v.plataforma || 'youtube'
    })) : [];

    const result = await db.collection('noticias').insertOne({
      titulo,
      resumo,
      conteudo,
      categoria: categoria || 'geral',
      imagem_url: imagem_url || null,
      videos: videosNorm,
      autor: req.user.username,
      autor_perfil: req.user.perfil,
      instituicao_id: ehGestor ? (oid(donoId) || donoId) : (instituicao_id ? (oid(instituicao_id) || instituicao_id) : null),
      destaque: destaque ? 1 : 0,
      publicada: ehAdmin ? 1 : 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      id: result.insertedId,
      message: ehAdmin ? 'Notícia criada e publicada' : 'Notícia criada. Aguarda aprovação do administrador.',
      pendente_aprovacao: !ehAdmin
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar notícia' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { titulo, resumo, conteudo, categoria, imagem_url, destaque, publicada, videos } = req.body;
    const noticia = await db.collection('noticias').findOne({ _id: new ObjectId(req.params.id) });
    if (!noticia) return res.status(404).json({ error: 'Notícia não encontrada' });

    if (req.user.perfil === 'instituicao') {
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
      if (usuario?.entidade_id && noticia.instituicao_id && noticia.instituicao_id.toString() !== usuario.entidade_id.toString()) {
        return res.status(403).json({ error: 'Sem permissão para editar esta notícia' });
      }
    }

    const videosNorm = Array.isArray(videos) ? videos.filter(v => v && v.url).map(v => ({
      url: v.url,
      titulo: v.titulo || '',
      plataforma: v.plataforma || 'youtube'
    })) : noticia.videos || [];

    const set = {
      titulo, resumo, conteudo, categoria,
      imagem_url: imagem_url || noticia.imagem_url,
      videos: videosNorm,
      destaque: destaque ? 1 : 0,
      updated_at: new Date()
    };

    if (req.user.perfil === 'admin') {
      set.publicada = publicada ?? noticia.publicada;
    }

    await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: set }
    );
    res.json({ message: 'Atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const noticia = await db.collection('noticias').findOne({ _id: new ObjectId(req.params.id) });
    if (!noticia) return res.status(404).json({ error: 'Notícia não encontrada' });

    if (req.user.perfil === 'instituicao') {
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
      if (usuario?.entidade_id && noticia.instituicao_id && noticia.instituicao_id.toString() !== usuario.entidade_id.toString()) {
        return res.status(403).json({ error: 'Sem permissão para eliminar esta notícia' });
      }
    }

    await db.collection('noticias').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.post('/:id/imagem', authenticateToken, upload.uploadNoticias.single('imagem'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const db = getDB();
    const imagemUrl = req.file.path;
    await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { imagem_url: imagemUrl, updated_at: new Date() } }
    );
    res.json({ imagem_url: imagemUrl, message: 'Imagem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem da notícia:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

router.post('/:id/video', authenticateToken, upload.uploadVideos.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum vídeo enviado' });
    const db = getDB();
    const noticia = await db.collection('noticias').findOne({ _id: new ObjectId(req.params.id) });
    if (!noticia) return res.status(404).json({ error: 'Notícia não encontrada' });

    const video = {
      url: req.file.path,
      titulo: req.body.titulo || '',
      plataforma: 'upload'
    };
    const videos = [...(noticia.videos || []), video];
    await db.collection('noticias').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { videos, updated_at: new Date() } }
    );
    res.json({ video, message: 'Vídeo institucional carregado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
  }
});

module.exports = router;
