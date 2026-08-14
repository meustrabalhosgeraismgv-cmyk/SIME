const multer = require('multer');
const path = require('path');
const fs = require('fs');

function criarUpload(pasta, opcoes = {}) {
  const uploadsDir = path.join(__dirname, '..', 'uploads', pasta);

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = req.user ? req.user.id : 'an';
      const filename = `${base}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, filename);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (opcoes.todosTipos) {
      cb(null, true);
    } else {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas ficheiros JPG, PNG e WebP são aceites'), false);
      }
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: opcoes.maxSize || 5 * 1024 * 1024
    }
  });
}

const upload = criarUpload('fotos');
upload.uploadInstituicoes = criarUpload('instituicoes');
upload.chat = criarUpload('chat', { todosTipos: true, maxSize: 25 * 1024 * 1024 });

module.exports = upload;