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
    } else if (opcoes.videos) {
      const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
      if (videoTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas ficheiros de vídeo (MP4, WebM, OGG, MOV, AVI) são aceites'), false);
      }
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
      fileSize: opcoes.maxSize || (opcoes.videos ? 200 * 1024 * 1024 : 5 * 1024 * 1024)
    }
  });
}

const upload = criarUpload('fotos');
upload.uploadInstituicoes = criarUpload('instituicoes');
upload.uploadNoticias = criarUpload('noticias');
upload.uploadVideos = criarUpload('videos', { videos: true, maxSize: 200 * 1024 * 1024 });
upload.chat = criarUpload('chat', { todosTipos: true, maxSize: 25 * 1024 * 1024 });
upload.documentos = criarUpload('documentos', { todosTipos: true, maxSize: 10 * 1024 * 1024 });

module.exports = upload;