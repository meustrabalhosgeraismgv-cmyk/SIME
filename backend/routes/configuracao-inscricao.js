const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { matchId, matchInstituicaoId } = require('../utils/filters');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const controller = require('../controllers/configuracaoInscricaoController');

router.get('/:instituicaoId', controller.getPublica);

router.use(authenticateToken);

router.get('/:instituicaoId/me', async (req, res, next) => {
  try {
    const { instituicaoId } = req.params;
    if (!['admin', 'instituicao'].includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Apenas administradores e gestores podem gerir requisitos' });
    }
    if (req.user.perfil === 'instituicao') {
      const db = getDB();
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
      const entidadeId = matchInstituicaoId(usuario?.entidade_id);
      if (entidadeId && String(entidadeId) !== String(matchId(instituicaoId))) {
        return res.status(403).json({ error: 'Sem permissão para esta instituição' });
      }
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro' });
  }
}, controller.getMinha);

router.post('/gerar', async (req, res, next) => {
  if (!['admin', 'instituicao'].includes(req.user.perfil)) {
    return res.status(403).json({ error: 'Apenas administradores e gestores podem gerar requisitos' });
  }
  return next();
}, controller.gerarComAssistente);

router.put('/:instituicaoId', async (req, res, next) => {
  try {
    const { instituicaoId } = req.params;
    if (!['admin', 'instituicao'].includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Apenas administradores e gestores podem configurar requisitos' });
    }
    if (req.user.perfil === 'instituicao') {
      const db = getDB();
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
      const entidadeId = matchInstituicaoId(usuario?.entidade_id);
      if (entidadeId && String(entidadeId) !== String(matchId(instituicaoId))) {
        return res.status(403).json({ error: 'Sem permissão para esta instituição' });
      }
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro' });
  }
}, controller.salvar);

router.post('/:instituicaoId/aprovar', async (req, res, next) => {
  try {
    const { instituicaoId } = req.params;
    if (!['admin', 'instituicao'].includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Apenas administradores e gestores podem aprovar requisitos' });
    }
    if (req.user.perfil === 'instituicao') {
      const db = getDB();
      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
      const entidadeId = matchInstituicaoId(usuario?.entidade_id);
      if (entidadeId && String(entidadeId) !== String(matchId(instituicaoId))) {
        return res.status(403).json({ error: 'Sem permissão para esta instituição' });
      }
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro' });
  }
}, controller.aprovar);

module.exports = router;