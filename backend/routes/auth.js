const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const { login, register, uploadFoto, getPerfilCompleto } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/login', login);
router.post('/register', register);

router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('usuarios').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.get('/perfil-completo', authenticateToken, getPerfilCompleto);

router.put('/perfil', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { nome, email, telefone, nova_senha } = req.body;
    const updateFields = { nome, email, telefone };

    if (nova_senha) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync(nova_senha, 10);
      updateFields.password = hash;
    }

    await db.collection('usuarios').updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updateFields }
    );
    res.json({ message: 'Perfil actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao actualizar' });
  }
});

router.post('/upload-foto', authenticateToken, upload.single('foto'), uploadFoto);

module.exports = router;
