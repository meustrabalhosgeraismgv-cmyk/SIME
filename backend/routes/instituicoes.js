const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const {
  getInstituicoes,
  getInstituicaoById,
  createInstituicao,
  updateInstituicao,
  deleteInstituicao,
  getEstatisticasInstituicao
} = require('../controllers/instituicaoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', async (req, res) => {
  try {
    const db = getDB();
    const total = await db.collection('instituicoes').countDocuments();
    const alunos = await db.collection('alunos').countDocuments();
    const professores = await db.collection('professores').countDocuments();

    const vagasAgg = await db.collection('instituicoes').aggregate([
      { $group: { _id: null, total: { $sum: '$vagas_disponiveis' } } }
    ]).toArray();
    const vagas = vagasAgg[0]?.total || 0;

    res.json({ total, alunos, professores, vagas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

router.get('/', getInstituicoes);
router.get('/:id', getInstituicaoById);
router.get('/:id/estatisticas', getEstatisticasInstituicao);
router.post('/', authenticateToken, authorizeRole('admin'), createInstituicao);
router.put('/:id', authenticateToken, authorizeRole('admin', 'instituicao'), updateInstituicao);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteInstituicao);

router.post('/:id/imagem', authenticateToken, authorizeRole('admin', 'instituicao'), upload.uploadInstituicoes.single('imagem'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    if (req.user.perfil === 'instituicao' && req.user.entidade_id !== req.params.id) {
      return res.status(403).json({ error: 'Não tem permissão para editar esta instituição' });
    }

    const db = getDB();
    const imagemUrl = `/uploads/instituicoes/${req.file.filename}`;
    await db.collection('instituicoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { imagem_url: imagemUrl, updated_at: new Date() } }
    );
    res.json({ imagem_url: imagemUrl, message: 'Imagem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

router.post('/:id/logotipo', authenticateToken, authorizeRole('admin', 'instituicao'), upload.uploadInstituicoes.single('logotipo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    if (req.user.perfil === 'instituicao' && req.user.entidade_id !== req.params.id) {
      return res.status(403).json({ error: 'Não tem permissão para editar esta instituição' });
    }

    const db = getDB();
    const logotipoUrl = `/uploads/instituicoes/${req.file.filename}`;
    await db.collection('instituicoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { logotipo_url: logotipoUrl, updated_at: new Date() } }
    );
    res.json({ logotipo_url: logotipoUrl, message: 'Logotipo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer upload do logotipo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do logotipo' });
  }
});

module.exports = router;
