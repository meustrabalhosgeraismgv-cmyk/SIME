const express = require('express');
const router = express.Router();
const { getDB } = require('../config/mongodb');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const CHAVES = ['hero', 'noticias_capa', 'login_capa', 'sobre'];

function urlAbs(req, p) {
  if (!p) return null;
  return `${req.protocol}://${req.get('host')}${p}`;
}

async function getConfig() {
  const db = getDB();
  return db.collection('configs').findOne({ _id: 'system' });
}

function toConfig(doc, req) {
  const out = { hero: null, noticias_capa: null, login_capa: null, sobre: null };
  if (!doc) return out;
  CHAVES.forEach(k => {
    const item = doc[k];
    if (item) {
      out[k] = {
        imagem: item.imagem ? urlAbs(req, item.imagem) : null,
        video: item.video ? urlAbs(req, item.video) : null,
        titulo: item.titulo || '',
        subtitulo: item.subtitulo || ''
      };
    }
  });
  return out;
}

router.get('/', async (req, res) => {
  try {
    const doc = await getConfig();
    res.json({ data: toConfig(doc, req) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.put('/:chave', authenticateToken, authorizeRole('admin'), upload.uploadInstituicoes.single('imagem'), async (req, res) => {
  try {
    const chave = req.params.chave;
    if (!CHAVES.includes(chave)) return res.status(400).json({ error: 'Chave de configuração inválida' });

    const db = getDB();
    const doc = await getConfig() || {};
    const atual = doc[chave] || {};

    const novo = {
      titulo: req.body.titulo !== undefined ? req.body.titulo : atual.titulo || '',
      subtitulo: req.body.subtitulo !== undefined ? req.body.subtitulo : atual.subtitulo || '',
      video: req.body.video !== undefined && req.body.video !== '' ? req.body.video : atual.video || null
    };

    if (req.file) {
      novo.imagem = req.file.path;
    } else if (atual.imagem) {
      novo.imagem = atual.imagem;
    }

    const setDoc = { ...doc, [chave]: novo };
    await db.collection('configs').updateOne(
      { _id: 'system' },
      { $set: setDoc },
      { upsert: true }
    );

    res.json({ message: 'Imagem do sistema atualizada', data: toConfig(setDoc, req)[chave] });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

module.exports = router;