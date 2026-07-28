require('dotenv').config();
const { connectDB, getDB } = require('./config/mongodb');

const COORDS_MAP = {
  'Faculdade de Economia (UJES)': { lat: -12.79815, lng: 15.73324 },
  'Faculdade de Direito (UJES)': { lat: -12.79950, lng: 15.73410 },
  'Instituto Superior de Ciências da Educação do Huambo (ISCED)': { lat: -12.77475, lng: 15.74914 },
  'ISCED do Huambo': { lat: -12.77475, lng: 15.74914 },
  'Instituto Superior Politécnico da Caála': { lat: -12.85732, lng: 15.55621 },
  'Instituto Superior Politécnico Católico do Huambo (ISPOCHBO)': { lat: -12.77581, lng: 15.72912 },
  'Instituto Superior Politécnico Lusíada do Huambo': { lat: -12.76632, lng: 15.74850 },
  'ISUPE - Inst. Sup. Politécnico Ekuikui II': { lat: -12.76815, lng: 15.72590 },
  'Complexo Escolar Privado Politécnico do Huambo': { lat: -12.77120, lng: 15.74415 },
  'Complexo Escolar nº 34 - Augusto Ngangula': { lat: -12.76750, lng: 15.72480 },
  'Complexo Escolar Privado Huambo Calunga II': { lat: -12.78440, lng: 15.72110 },
  'Liceu do Huambo': { lat: -12.77910, lng: 15.73890 },
  'Instituto Politécnico de Administração e Gestão (IPAG)': { lat: -12.78320, lng: 15.74150 },
  'Instituto Politécnico Privado 7 Cores': { lat: -12.78865, lng: 15.74124 },
  'Complexo Escolar Privado Politécnico Namunga': { lat: -12.78051, lng: 15.73949 },
  'IGCA (Colégio)': { lat: -12.77733, lng: 15.73537 },
  'Complexo Escolar Rei Livongue': { lat: -12.76869, lng: 15.72862 },
  'Escola Primária No 53': { lat: -12.77150, lng: 15.74985 },
  'Escola Primária n°111 Benfica': { lat: -12.75407, lng: 15.74315 },
  'Escola Primária Nº 111 Benfica': { lat: -12.75407, lng: 15.74315 },
  'Escola de Ensino Primário n°105 Chiva': { lat: -12.73647, lng: 15.78871 },
  'Escola Primária No 32': { lat: -12.77674, lng: 15.74200 },
  'Escola Primária Nº 32': { lat: -12.77674, lng: 15.74200 },
  'Escola São José de Cluny': { lat: -12.77044, lng: 15.80751 },
  'Escola Primária Cangombe': { lat: -12.19056, lng: 15.84945 },
  'Escola Comandante Dangereux (Capango)': { lat: -12.76105, lng: 15.75780 },
};

async function migrate() {
  await connectDB();
  const db = getDB();
  const collection = db.collection('instituicoes');

  const allSchools = await collection.find({}).toArray();
  let updated = 0;

  for (const school of allSchools) {
    let coords = null;

    for (const [key, val] of Object.entries(COORDS_MAP)) {
      if (school.nome && school.nome.includes(key.replace(/[()]/g, '').substring(0, 15))) {
        coords = val;
        break;
      }
    }

    if (!coords) {
      console.log(`⚠️  Sem coordenadas: ${school.nome}`);
      continue;
    }

    await collection.updateOne(
      { _id: school._id },
      { $set: { lat: coords.lat, lng: coords.lng } }
    );
    updated++;
    console.log(`✅ ${school.nome} → ${coords.lat}, ${coords.lng}`);
  }

  console.log(`\n📊 Migração concluída: ${updated}/${allSchools.length} escolas actualizadas`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
