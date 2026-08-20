const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { matchId, matchInstituicaoId } = require('../utils/filters');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const controller = require('../controllers/configuracaoInscricaoController');

async function verificarAcesso(req, res, next) {
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
}

router.get('/:instituicaoId', controller.getPublica);

router.use(authenticateToken);

router.get('/:instituicaoId/me', verificarAcesso, controller.getMinha);

router.post('/gerar', async (req, res, next) => {
  if (!['admin', 'instituicao'].includes(req.user.perfil)) {
    return res.status(403).json({ error: 'Apenas administradores e gestores podem gerar requisitos' });
  }
  return next();
}, controller.gerarComAssistente);

router.put('/:instituicaoId', verificarAcesso, controller.salvar);

router.post('/:instituicaoId/aprovar', verificarAcesso, controller.aprovar);

router.post('/:instituicaoId/formulario-modelo', verificarAcesso, upload.formularios.single('ficheiro'), controller.uploadModelo);

router.delete('/:instituicaoId/formulario-modelo', verificarAcesso, controller.removerModelo);

module.exports = router;