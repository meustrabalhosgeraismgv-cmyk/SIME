const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 't4c9ndb5',
  api_key: process.env.CLOUDINARY_API_KEY || '215538167475455',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'n0204dzpuyYtNvmXAZYSPjJtmxo',
});

function criarUpload(pasta, opcoes = {}) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const base = req.user ? req.user.id : 'an';
      const ext = file.originalname.split('.').pop();
      const publicId = `${base}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

      const folder = `sime/${pasta}`;
      const resourceType = opcoes.videos ? 'video' : (opcoes.todosTipos ? 'auto' : 'image');

      return {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        format: ext,
        unique_filename: false,
        overwrite: false,
      };
    },
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
upload.formularios = criarUpload('formularios', { todosTipos: true, maxSize: 10 * 1024 * 1024 });
upload.comprovativos = criarUpload('comprovativos', { todosTipos: true, maxSize: 10 * 1024 * 1024 });

module.exports = upload;
