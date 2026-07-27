const express = require('express');
const router = express.Router();
const { login, register, uploadFoto, getPerfilCompleto } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/database');

router.post('/login', login);
router.post('/register', register);

router.get('/perfil', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nome, email, telefone, perfil, is_gestor, entidade_id, foto, aprovado FROM usuarios WHERE id=?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/perfil-completo', authenticateToken, getPerfilCompleto);

router.put('/perfil', authenticateToken, (req, res) => {
  try {
    const { nome, email, telefone, nova_senha } = req.body;
    if (nova_senha) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync(nova_senha, 10);
      db.prepare('UPDATE usuarios SET nome=?, email=?, telefone=?, password=? WHERE id=?').run(nome, email, telefone, hash, req.user.id);
    } else {
      db.prepare('UPDATE usuarios SET nome=?, email=?, telefone=? WHERE id=?').run(nome, email, telefone, req.user.id);
    }
    res.json({ message: 'Perfil actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao actualizar' });
  }
});

router.post('/upload-foto', authenticateToken, upload.single('foto'), uploadFoto);

module.exports = router;