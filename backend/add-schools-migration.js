const { getDB } = require('./config/mongodb');

const CLASSES_PRIMARIO = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
const CLASSES_MEDIO = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];

const NEW_SCHOOLS = [
  {
    nome: 'Escola Vila Seca',
    tipo: 'ensino_primario',
    descricao: 'A Escola Missionária Vilaseca Esparza fica no bairro da Aviação, na cidade de Huambo, em Angola. Oferece ensino primário e secundário com uma base cristã.',
    endereco: 'Bairro da Aviação, Huambo',
    lema: 'Educar com fé e saber',
    video_url: 'https://drive.google.com/file/d/1h_mHX815neDFyOBQDklPtHvQLsmx90Yp/preview',
    video_titulo: 'Escola Vila Seca - Apresentação',
    latitude: -12.7650,
    longitude: 15.7350,
    vagas: 360,
    classes: CLASSES_PRIMARIO
  },
  {
    nome: 'Escola Rei Livongue',
    tipo: 'ensino_medio',
    descricao: 'O Complexo Escolar Rei Livongue é uma instituição pública de ensino secundário no Bairro Calilongue, Huambo. Criada em 2016. 26 salas, 78 turmas, 3 turnos.',
    endereco: 'Bairro Calilongue, Huambo',
    lema: 'Conhecimento é poder',
    video_url: 'https://drive.google.com/file/d/1Mnsqpbi6yo_XKrt12rnStmo1k1eU3z96/preview',
    video_titulo: 'Escola Rei Livongue - Tour Virtual',
    latitude: -12.7700,
    longitude: 15.7400,
    vagas: 780,
    classes: CLASSES_MEDIO
  },
  {
    nome: 'Colégio Comandante Nzali',
    tipo: 'ensino_primario',
    descricao: 'O Colégio Comandante Nzali é uma instituição de ensino primário em Huambo. Formação integral dos alunos.',
    endereco: 'Huambo',
    lema: 'Disciplina e excelência',
    video_url: 'https://drive.google.com/file/d/1ZjWXLokBNk6zbCxgszfFnc3s-DqITkQX/preview',
    video_titulo: 'Colégio Comandante Nzali - Apresentação',
    latitude: -12.7720,
    longitude: 15.7380,
    vagas: 320,
    classes: CLASSES_PRIMARIO
  },
  {
    nome: 'Instituto Mensageiro',
    tipo: 'ensino_medio',
    descricao: 'O Instituto Mensageiro é uma instituição de ensino no bairro do Santo António, Huambo. Ensino médio com foco na formação técnica.',
    endereco: 'Santo António, Huambo',
    lema: 'Formar para o futuro',
    video_url: 'https://drive.google.com/file/d/1zXEOP2GQVJakiwqxYENS6u5beHi484sH/preview',
    video_titulo: 'Instituto Mensageiro - Conheça',
    latitude: -12.7680,
    longitude: 15.7330,
    vagas: 420,
    classes: CLASSES_MEDIO
  }
];

async function addSchoolsWithVideos() {
  const db = getDB();
  let added = 0;
  
  for (const school of NEW_SCHOOLS) {
    const existing = await db.collection('instituicoes').findOne({ nome: school.nome });
    if (existing) {
      const update = {};
      if (!existing.video_url) update.video_url = school.video_url;
      if (!existing.video_titulo) update.video_titulo = school.video_titulo;
      if (!existing.descricao) update.descricao = school.descricao;
      if (!existing.lema) update.lema = school.lema;
      if (!existing.vagas) update.vagas = school.vagas;
      if (!existing.classes || existing.classes.length === 0) update.classes = school.classes;
      
      if (Object.keys(update).length > 0) {
        await db.collection('instituicoes').updateOne({ _id: existing._id }, { $set: update });
        console.log(`✓ ${school.nome} — actualizado`);
        added++;
      }
    } else {
      const codigo = school.nome.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
      await db.collection('instituicoes').insertOne({
        ...school,
        codigo,
        municipio_nome: 'Huambo',
        provincia_nome: 'Huambo',
        telefone: '',
        email: '',
        site: '',
        foto: '',
        banner: '',
        is_gestor: false,
        gestor_id: null,
        ativo: true,
        created_at: new Date()
      });
      console.log(`✓ ${school.nome} — inserido`);
      added++;
    }
  }
  
  return added;
}

module.exports = { addSchoolsWithVideos, NEW_SCHOOLS };
