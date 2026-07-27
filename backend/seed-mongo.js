const { getDB } = require('./config/mongodb');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const db = getDB();

  const count = await db.collection('usuarios').countDocuments();
  if (count > 0) {
    console.log(`Base já populada (${count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed completo...');
  const hash = bcrypt.hashSync('123456', 10);

  const provincias = [
    { nome: 'Huambo', codigo: 'HUA' }, { nome: 'Benguela', codigo: 'BEN' },
    { nome: 'Bié', codigo: 'BIE' }, { nome: 'Luanda', codigo: 'LUA' },
    { nome: 'Kwanza Norte', codigo: 'KNO' }, { nome: 'Kwanza Sul', codigo: 'KSU' },
    { nome: 'Namibe', codigo: 'NAM' }
  ];
  const provResult = await db.collection('provincias').insertMany(provincias);
  const provIds = {};
  Object.keys(provResult.insertedIds).forEach((k, i) => { provIds[provincias[i].nome] = provResult.insertedIds[k].toString(); });

  const municipios = [
    { nome: 'Huambo', prov: 'Huambo' }, { nome: 'Longonjo', prov: 'Huambo' },
    { nome: 'Bailundo', prov: 'Huambo' }, { nome: 'Ecunha', prov: 'Huambo' },
    { nome: 'Catchiungo', prov: 'Huambo' }, { nome: 'Lumbo', prov: 'Huambo' },
    { nome: 'Benguela', prov: 'Benguela' }, { nome: 'Lobito', prov: 'Benguela' },
    { nome: 'Catumbela', prov: 'Benguela' }, { nome: 'Cuito', prov: 'Bié' },
    { nome: 'Camacupa', prov: 'Bié' }, { nome: 'Luanda', prov: 'Luanda' },
    { nome: 'Cacuaco', prov: 'Luanda' }, { nome: 'Viana', prov: 'Luanda' },
    { nome: "N'dalatando", prov: 'Kwanza Norte' }, { nome: 'Samba Caju', prov: 'Kwanza Sul' },
    { nome: 'Moçâmedes', prov: 'Namibe' }
  ].map(m => ({ ...m, provincia_id: provIds[m.prov] }));
  const munResult = await db.collection('municipios').insertMany(municipios);
  const munIds = {};
  Object.keys(munResult.insertedIds).forEach((k, i) => { munIds[municipios[i].nome] = munResult.insertedIds[k].toString(); });

  const escolas = [
    { nome: 'ISCED do Huambo', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7642, lng: 15.7366, vt: 1500, vd: 450, dir: 'Prof. Joaquim Pimenta', tel: '241 234 567', email: 'isced@huambo.ao' },
    { nome: 'Universidade José Eduardo dos Santos (UJES)', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7700, lng: 15.7400, vt: 2000, vd: 600, dir: 'Prof. Carlos Alberto', tel: '241 234 000', email: 'info@ujes.ao' },
    { nome: 'Instituto Politécnico Superior do Huambo', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7650, lng: 15.7380, vt: 1200, vd: 360, dir: 'Prof. Maria da Conceição', tel: '241 234 111', email: 'info@ipshi.ao' },
    { nome: 'Universidade Católica de Angola - Sede Huambo', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7680, lng: 15.7350, vt: 800, vd: 240, dir: 'Pe. António Fernando', tel: '241 234 222', email: 'huambo@ucan.ao' },
    { nome: 'Faculdade de Artes e Educação (FAJE)', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7620, lng: 15.7390, vt: 600, vd: 180, dir: 'Prof. Ana Paula', tel: '241 234 333', email: 'info@faje.ao' },
    { nome: 'Faculdade de Direito do Huambo (FJD)', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7630, lng: 15.7410, vt: 500, vd: 150, dir: 'Prof. Manuel da Cruz', tel: '241 234 444', email: 'info@fjd.ao' },
    { nome: 'Instituto Superior de Ciências da Saúde do Huambo', tipo: 'ensino_superior', mun: 'Huambo', lat: -12.7670, lng: 15.7420, vt: 400, vd: 120, dir: 'Dr. Pedro Sebastião', tel: '241 234 555', email: 'info@iscsh.ao' },
    { nome: 'Escola Secundária José Martí', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7640, lng: 15.7370, vt: 800, vd: 280, dir: 'Prof. António Neto', tel: '241 234 678', email: 'esm@huambo.ao' },
    { nome: 'Escola Secundária Maria de Lurdes', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7660, lng: 15.7395, vt: 750, vd: 262, dir: 'Prof. Teresa Almeida', tel: '241 234 789', email: 'esml@huambo.ao' },
    { nome: 'Complexo Escolar Privado Huambo Calunga II', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7610, lng: 15.7355, vt: 650, vd: 228, dir: 'Eng. João Silva', tel: '241 234 890', email: 'calunga@huambo.ao' },
    { nome: 'Complexo Escolar Privado Politécnico Namunga', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7690, lng: 15.7415, vt: 400, vd: 140, dir: 'Prof. Sara Domingos', tel: '241 234 901', email: 'namunga@huambo.ao' },
    { nome: 'Complexo Escolar Privado Politécnico do Huambo', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7625, lng: 15.7405, vt: 800, vd: 280, dir: 'Prof. Carlos Mendes', tel: '241 234 012', email: 'polihua@huambo.ao' },
    { nome: 'Complexo Escolar Rei Livongue', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7675, lng: 15.7360, vt: 450, vd: 158, dir: 'Prof. David Tchipalhala', tel: '241 234 123', email: 'reilivongue@huambo.ao' },
    { nome: 'Complexo Escolar nº 34 - Augusto Ngangula', tipo: 'ensino_medio', mun: 'Huambo', lat: -12.7655, lng: 15.7345, vt: 750, vd: 263, dir: 'Prof. Augusta Nhaca', tel: '241 234 234', email: 'ecn34@huambo.ao' },
    { nome: 'Escola Comandante Dangereux (Capango)', tipo: 'ensino_primario', mun: 'Huambo', lat: -12.7600, lng: 15.7385, vt: 350, vd: 123, dir: 'Prof. Ernesto Dangereux', tel: '241 234 345', email: 'ecd@huambo.ao' },
    { nome: 'Escola Primária Cangombe', tipo: 'ensino_primario', mun: 'Bailundo', lat: -12.8100, lng: 15.7300, vt: 200, vd: 70, dir: 'Prof. Rosa Cangombe', tel: '241 234 456', email: 'cangombe@bailundo.ao' },
    { nome: 'Escola Primária Nº 111 Benfica', tipo: 'ensino_primario', mun: 'Huambo', lat: -12.7635, lng: 15.7375, vt: 250, vd: 88, dir: 'Prof. Carlos Benfica', tel: '241 234 567', email: 'ep111@huambo.ao' },
    { nome: 'Escola Primária Nº 32', tipo: 'ensino_primario', mun: 'Huambo', lat: -12.7645, lng: 15.7365, vt: 280, vd: 98, dir: 'Prof. Mónica Santos', tel: '241 234 678', email: 'ep32@huambo.ao' },
    { nome: 'Escola Primária Nº 45 Caluquembe', tipo: 'ensino_primario', mun: 'Huambo', lat: -12.7720, lng: 15.7430, vt: 220, vd: 77, dir: 'Prof. João Caluquembe', tel: '241 234 789', email: 'ep45@huambo.ao' },
    { nome: 'Escola Primária Nº 78 Saiombo', tipo: 'ensino_primario', mun: 'Bailundo', lat: -12.8200, lng: 15.7250, vt: 180, vd: 63, dir: 'Prof. Ana Saiombo', tel: '241 234 890', email: 'ep78@bailundo.ao' },
    { nome: 'Jardim de Infância Sonho dourado', tipo: 'pre_escolar', mun: 'Huambo', lat: -12.7658, lng: 15.7388, vt: 60, vd: 21, dir: 'Prof. Helena Fernandes', tel: '241 234 901', email: 'jisolho@huambo.ao' },
    { nome: 'Jardim de Infância Estrelinha', tipo: 'pre_escolar', mun: 'Huambo', lat: -12.7615, lng: 15.7395, vt: 50, vd: 18, dir: 'Prof. Conceição Neto', tel: '241 234 012', email: 'jiestrelinha@huambo.ao' },
    { nome: 'Jardim de Infância Crescer', tipo: 'pre_escolar', mun: 'Bailundo', lat: -12.8150, lng: 15.7280, vt: 40, vd: 14, dir: 'Prof. Marta Crescer', tel: '241 234 123', email: 'jicrescer@bailundo.ao' },
    { nome: 'Escola do Futuro', tipo: 'ensino_primario', mun: 'Longonjo', lat: -12.9000, lng: 15.5500, vt: 150, vd: 53, dir: 'Prof. Paulo Futuro', tel: '241 234 234', email: 'escolafuturo@longonjo.ao' }
  ].map(e => ({
    ...e, municipio_id: munIds[e.mun], responsavel: e.dir, status: 'ativa',
    created_at: new Date(), updated_at: new Date()
  }));
  const escResult = await db.collection('instituicoes').insertMany(escolas);
  const escIds = Object.values(escResult.insertedIds);

  await db.collection('usuarios').insertMany([
    { username: 'admin', password: hash, nome: 'Administrador do Sistema', email: 'admin@sime.ao', telefone: '241 923 000 000', perfil: 'admin', is_gestor: false, entidade_id: null, entidade_tipo: null, aprovado: true, foto: null, created_at: new Date() },
    { username: 'escola.huambo', password: hash, nome: 'Gestor ISCED Huambo', email: 'gestor@isced.ao', telefone: '241 234 567', perfil: 'instituicao', is_gestor: true, entidade_id: escIds[0].toString(), entidade_tipo: 'instituicao', aprovado: true, foto: null, created_at: new Date() },
    { username: 'encarregado1', password: hash, nome: 'Manuel Fernandes', email: 'manuel@email.com', telefone: '923 456 789', perfil: 'encarregado', is_gestor: false, entidade_id: null, entidade_tipo: null, aprovado: true, foto: null, created_at: new Date() },
    { username: 'encarregado2', password: hash, nome: 'Teresa dos Santos', email: 'teresa@email.com', telefone: '923 456 790', perfil: 'encarregado', is_gestor: false, entidade_id: null, entidade_tipo: null, aprovado: true, foto: null, created_at: new Date() },
    { username: 'encarregado3', password: hash, nome: 'Paulo Miguel', email: 'paulo@email.com', telefone: '923 456 791', perfil: 'encarregado', is_gestor: false, entidade_id: null, entidade_tipo: null, aprovado: true, foto: null, created_at: new Date() }
  ]);

  const turmasPrimario = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
  const turmasDoc = [];
  for (let i = 5; i <= 20; i++) {
    turmasPrimario.forEach(t => {
      turmasDoc.push({ nome: t, ano_letivo: 2025, nivel: t, instituicao_id: escIds[i - 1].toString(), professor_titular_id: null, vagas: 40, vagas_ocupadas: Math.floor(Math.random() * 15) + 5, created_at: new Date() });
    });
  }
  const niveisMedio = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];
  for (let i = 8; i <= 14; i++) {
    niveisMedio.forEach(t => {
      turmasDoc.push({ nome: t, ano_letivo: 2025, nivel: t, instituicao_id: escIds[i - 1].toString(), professor_titular_id: null, vagas: 45, vagas_ocupadas: Math.floor(Math.random() * 20) + 5, created_at: new Date() });
    });
  }
  if (turmasDoc.length > 0) await db.collection('turmas').insertMany(turmasDoc);

  const cursosDoc = [
    ...['Engenharia Informática', 'Direito', 'Economia', 'Medicina', 'Engenharia Civil', 'Farmácia', 'Enfermagem', 'Contabilidade', 'Gestão', 'Relações Internacionais'].map(n => ({
      instituicao_id: escIds[0].toString(), nome: n, tipo: 'curso', grau: 'licenciatura', duracao: '4 anos', vagas_totais: 100, vagas_disponiveis: 30, turno: 'diurno', estado: 'ativo', created_at: new Date()
    })),
    { instituicao_id: escIds[0].toString(), nome: 'Mestrado em Informática', tipo: 'curso', grau: 'mestrado', duracao: '2 anos', vagas_totais: 30, vagas_disponiveis: 9, turno: 'diurno', estado: 'ativo', created_at: new Date() },
    { instituicao_id: escIds[0].toString(), nome: 'Mestrado em Direito', tipo: 'curso', grau: 'mestrado', duracao: '2 anos', vagas_totais: 30, vagas_disponiveis: 9, turno: 'diurno', estado: 'ativo', created_at: new Date() },
    ...['Engenharia de Minas', 'Arquitectura', 'Engenharia Electrotécnica', 'Sociologia', 'Filosofia'].map(n => ({
      instituicao_id: escIds[1].toString(), nome: n, tipo: 'curso', grau: 'licenciatura', duracao: '4-5 anos', vagas_totais: 70, vagas_disponiveis: 21, turno: 'diurno', estado: 'ativo', created_at: new Date()
    }))
  ];
  await db.collection('cursos').insertMany(cursosDoc);

  await db.collection('calendario').insertMany([
    { titulo: 'Início das Aulas', descricao: 'Início do ano lectivo 2025/2026', data_inicio: '2025-09-15', data_fim: '2025-09-15', tipo: 'inicio', ano_letivo: 2026, created_at: new Date() },
    { titulo: 'Férias de Natal', descricao: 'Recesso de Natal e Ano Novo', data_inicio: '2025-12-20', data_fim: '2026-01-05', tipo: 'ferias', ano_letivo: 2026, created_at: new Date() },
    { titulo: 'Férias de Carnaval', descricao: 'Recesso de Carnaval', data_inicio: '2026-02-14', data_fim: '2026-02-18', tipo: 'ferias', ano_letivo: 2026, created_at: new Date() },
    { titulo: 'Exames Finais', descricao: 'Período de exames finais', data_inicio: '2026-05-20', data_fim: '2026-06-15', tipo: 'exame', ano_letivo: 2026, created_at: new Date() },
    { titulo: 'Fecho do Ano Lectivo', descricao: 'Entrega de resultados e encerramento', data_inicio: '2026-07-01', data_fim: '2026-07-05', tipo: 'fim', ano_letivo: 2026, created_at: new Date() }
  ]);

  const infoDocs = [
    { instituicao_id: escIds[0].toString(), horario_atendimento: '08:00 - 16:00', dias_atendimento: 'Segunda a Sexta', documentos_necessarios: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico', procedimentos_inscricao: 'Inscrição online. Documentos na secretaria.', taxa_reserva_rupe: 'AO06 0040 0000 8080 0001 1011 3', telefone_secretaria: '241 234 567', email_secretaria: 'secretaria@isced-huambo.ao', website: 'https://isced-huambo.ao', notas_admissionais: 'Exames de acesso: Matemática, Física, Português.', created_at: new Date() },
    { instituicao_id: escIds[1].toString(), horario_atendimento: '08:00 - 16:00', dias_atendimento: 'Segunda a Sexta', documentos_necessarios: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico, Pasta', procedimentos_inscricao: 'Submeter candidatura online.', taxa_reserva_rupe: 'AO06 0040 0000 8080 0001 2012 1', telefone_secretaria: '241 234 000', email_secretaria: 'secretaria@ujes.ao', website: 'https://ujes.ao', notas_admissionais: 'Notas mínimas variam por curso.', created_at: new Date() }
  ];
  await db.collection('informacoes_instituicao').insertMany(infoDocs);

  console.log('Seed MongoDB completo!');
}

module.exports = { seedDatabase };
