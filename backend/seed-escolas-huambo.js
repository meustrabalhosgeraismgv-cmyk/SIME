require('dotenv').config();
const { connectDB, getDB } = require('./config/mongodb');
const bcrypt = require('bcryptjs');
const { ESCOLAS_HUAMBO } = require('./seed-mongo');

async function main() {
  const db = await connectDB();
  if (!db) {
    console.error('Não foi possível ligar ao MongoDB.');
    process.exit(1);
  }

  let criadas = 0;
  let ignoradas = 0;

  for (const escola of ESCOLAS_HUAMBO) {
    const existente = await db.collection('instituicoes').findOne({ nome: escola.nome });
    if (existente) {
      ignoradas++;
      console.log(`[ignorada] já existe: ${escola.nome}`);
      continue;
    }

    const mun = await db.collection('municipios').findOne({ nome: escola.municipio });

    const instResult = await db.collection('instituicoes').insertOne({
      nome: escola.nome,
      tipo: escola.tipo,
      municipio_id: mun ? mun._id : null,
      email: `${escola.gestor}@sime.ao`,
      telefone: '+244 928 565 837',
      endereco: `${escola.municipio}, Huambo, Angola`,
      latitude: escola.latitude,
      longitude: escola.longitude,
      vagas_totais: escola.vagas,
      vagas_disponiveis: Math.round(escola.vagas * 0.35),
      responsavel: escola.responsavel,
      logotipo_url: null,
      imagem_url: null,
      lema: escola.lema,
      descricao: `${escola.nome} — instituição pública de ensino ${escola.tipo === 'ensino_primario' ? 'primário' : escola.tipo === 'ensino_secundario' ? 'secundário' : 'médio'} do município de ${escola.municipio}.`,
      aceita_inscricao_online: true,
      aceita_inscricao_presencial: true,
      taxa_inscricao: 0,
      taxa_matricula: 0,
      status: 'ativa',
      created_at: new Date(),
      updated_at: new Date()
    });
    const instId = instResult.insertedId.toString();

    const turmasDoc = escola.classes.map(n => ({
      nome: n, ano_letivo: new Date().getFullYear(), nivel: n, instituicao_id: instId,
      professor_titular_id: null, vagas: 40, vagas_ocupadas: 0, estado: 'ativa', created_at: new Date()
    }));
    await db.collection('turmas').insertMany(turmasDoc);

    const cursosDoc = escola.classes.map(n => ({
      instituicao_id: instId, nome: n, tipo: 'turma', grau: escola.tipo === 'ensino_primario' ? 'primario' : 'medio', duracao: '1 ano letivo',
      vagas_totais: 40, vagas_disponiveis: 40, turno: 'diurno', estado: 'ativo', created_at: new Date()
    }));
    await db.collection('cursos').insertMany(cursosDoc);

    await db.collection('informacoes_instituicao').insertOne({
      instituicao_id: instId,
      horario_atendimento: '08:00 - 16:00',
      dias_atendimento: 'Segunda a Sexta',
      documentos_necessarios: 'Bilhete de Identidade, Certificado, Atestado Médico',
      procedimentos_inscricao: 'Inscrição online através do SIME ou presencial na secretaria.',
      taxa_reserva_rupe: '',
      telefone_secretaria: '+244 928 565 837',
      email_secretaria: `secretaria@${escola.gestor}.sime.ao`,
      endereco_secretaria: `${escola.municipio}, Huambo, Angola`,
      website: '',
      link_portal_estudante: '',
      notas_admissionais: '',
      created_at: new Date()
    });

    const gestorExistente = await db.collection('usuarios').findOne({ username: escola.gestor });
    if (!gestorExistente) {
      const hashGestor = bcrypt.hashSync('Demo@2026', 10);
      await db.collection('usuarios').insertOne({
        username: escola.gestor, password: hashGestor, nome: escola.responsavel,
        email: `${escola.gestor}@sime.ao`, telefone: '+244 928 565 837', perfil: 'instituicao',
        is_gestor: true, entidade_id: instId, entidade_tipo: 'instituicao',
        aprovado: true, foto: null, created_at: new Date()
      });
    }

    criadas++;
    console.log(`[criada] ${escola.nome}`);
  }

  console.log(`\nConcluído: ${criadas} escolas criadas, ${ignoradas} já existentes.`);
  console.log('Credenciais dos gestores: username = ' + ESCOLAS_HUAMBO[0].gestor + ' | senha = Demo@2026');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });