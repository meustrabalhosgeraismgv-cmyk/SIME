const express = require('express');
const router = express.Router();
const {
  getDocumentos,
  getDocumentoById,
  getCategorias,
  createDocumento,
  updateDocumento,
  deleteDocumento
} = require('../controllers/documentoController');
const { authenticateToken, authenticateOptional } = require('../middleware/auth');

router.get('/', authenticateOptional, getDocumentos);
router.get('/categorias', getCategorias);
router.get('/:id', getDocumentoById);
router.post('/', authenticateToken, createDocumento);
router.put('/:id', authenticateToken, updateDocumento);
router.delete('/:id', authenticateToken, deleteDocumento);

module.exports = router;
