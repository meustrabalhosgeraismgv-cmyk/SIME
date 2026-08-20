const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { matchId, matchInstituicaoId } = require('../utils/filters');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const controller = require('../controllers/configuracaoFinanceiraController');

async function verificarAcesso(req, res, next) {
  try {
    const { instituicaoId } = req.params;
    if (!['admin', 'instituicao'].includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Apenas administradores e gestores podem gerir configurações financeiras' });
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
}

router.get('/:instituicaoId', controller.getPublica);

router.use(authenticateToken);

router.get('/:instituicaoId/me', verificarAcesso, controller.getMinha);

router.put('/:instituicaoId', verificarAcesso, controller.salvar);

module.exports = router;