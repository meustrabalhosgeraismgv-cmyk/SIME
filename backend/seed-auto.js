const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  await db.ready;

  const result = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (result && result.count > 0) {
    console.log(`Base já populada (${result.count} utilizadores), saltando seed.`);
    return;
  }

  console.log('Base vazia — executando seed completo...');

  const tables = [
    'pagamentos', 'solicitacoes', 'comunicados', 'notas', 'matriculas',
    'turmas', 'disciplinas', 'professores', 'alunos', 'encarregados',
    'alertas', 'estatisticas', 'noticias', 'usuarios', 'calendario',
    'cursos', 'informacoes_instituicao', 'instituicoes', 'municipios', 'provincias'
  ];
  tables.forEach(t => { try { db.exec(`DELETE FROM ${t}`); } catch(e) {} });

  const hash = bcrypt.hashSync('123456', 10);

  const provincias = [
    { nome: 'Huambo', codigo: 'HUA' },
    { nome: 'Benguela', codigo: 'BEN' },
    { nome: 'Bié', codigo: 'BIE' },
    { nome: 'Luanda', codigo: 'LUA' },
    { nome: 'Kwanza Norte', codigo: 'KNO' },
    { nome: 'Kwanza Sul', codigo: 'KSU' },
    { nome: 'Namibe', codigo: 'NAM' },
  ];
  const insertProv = db.prepare('INSERT INTO provincias (nome, codigo) VALUES (?, ?)');
  provincias.forEach(p => insertProv.run(p.nome, p.codigo));

  const municipios = [
    { nome: 'Huambo', prov: 'Huambo' }, { nome: 'Longonjo', prov: 'Huambo' },
    { nome: 'Bailundo', prov: 'Huambo' }, { nome: 'Ecunha', prov: 'Huambo' },
    { nome: 'Catchiungo', prov: 'Huambo' }, { nome: 'Lumbo', prov: 'Huambo' },
    { nome: 'Benguela', prov: 'Benguela' }, { nome: 'Lobito', prov: 'Benguela' },
    { nome: 'Catumbela', prov: 'Benguela' }, { nome: 'Cuito', prov: 'Bié' },
    { nome: 'Camacupa', prov: 'Bié' }, { nome: 'Luanda', prov: 'Luanda' },
    { nome: 'Cacuaco', prov: 'Luanda' }, { nome: 'Viana', prov: 'Luanda' },
    { nome: "N'dalatando", prov: 'Kwanza Norte' }, { nome: 'Samba Caju', prov: 'Kwanza Sul' },
    { nome: 'Moçâmedes', prov: 'Namibe' },
  ];
  const insertMun = db.prepare('INSERT INTO municipios (nome, provincia_id) VALUES (?, (SELECT id FROM provincias WHERE nome = ?))');
  municipios.forEach(m => insertMun.run(m.nome, m.prov));

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
    { nome: 'Escola do Futuro', tipo: 'ensino_primario', mun: 'Longonjo', lat: -12.9000, lng: 15.5500, vt: 150, vd: 53, dir: 'Prof. Paulo Futuro', tel: '241 234 234', email: 'escolafuturo@longonjo.ao' },
  ];

  const insertEsc = db.prepare('INSERT INTO instituicoes (nome, tipo, municipio_id, latitude, longitude, vagas_totais, vagas_disponiveis, responsavel, telefone, email, status) VALUES (?, ?, (SELECT id FROM municipios WHERE nome = ?), ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertUser = db.prepare('INSERT INTO usuarios (username, password, nome, email, telefone, perfil, is_gestor, entidade_id, entidade_tipo, aprovado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  escolas.forEach((e) => {
    insertEsc.run(e.nome, e.tipo, e.mun, e.lat, e.lng, e.vt, e.vd, e.dir, e.tel, e.email, 'ativa');
  });

  // Admin
  insertUser.run('admin', hash, 'Administrador do Sistema', 'admin@sime.ao', '241 923 000 000', 'admin', 0, null, null, 1);

  // Gestores institucionais
  const insertGestor = db.prepare('INSERT INTO usuarios (username, password, nome, email, telefone, perfil, is_gestor, entidade_id, entidade_tipo, aprovado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertGestor.run('escola.huambo', hash, 'Gestor ISCED Huambo', 'gestor@isced.ao', '241 234 567', 'instituicao', 1, 1, 'instituicao', 1);

  // Encarregados
  insertUser.run('encarregado1', hash, 'Manuel Fernandes', 'manuel@email.com', '923 456 789', 'encarregado', 0, null, null, 1);
  insertUser.run('encarregado2', hash, 'Teresa dos Santos', 'teresa@email.com', '923 456 790', 'encarregado', 0, null, null, 1);
  insertUser.run('encarregado3', hash, 'Paulo Miguel', 'paulo@email.com', '923 456 791', 'encarregado', 0, null, null, 1);

  const insertTurma = db.prepare('INSERT INTO turmas (nome, ano_letivo, nivel, instituicao_id, vagas, vagas_ocupadas) VALUES (?, ?, ?, ?, ?, ?)');

  const niveis = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
  for (let i = 5; i <= 20; i++) {
    niveis.forEach(t => {
      insertTurma.run(t, 2025, t, i, 40, Math.floor(Math.random()*15)+5);
    });
  }

  const niveisMedio = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];
  for (let i = 8; i <= 14; i++) {
    niveisMedio.forEach(t => {
      insertTurma.run(t, 2025, t, i, 45, Math.floor(Math.random()*20)+5);
    });
  }

  const insertCurso = db.prepare('INSERT INTO cursos (instituicao_id, nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const cursosISCED = [
    ['Engenharia Informática', 'curso', 'licenciatura', '4 anos', 120, 36],
    ['Direito', 'curso', 'licenciatura', '4 anos', 100, 30],
    ['Economia', 'curso', 'licenciatura', '4 anos', 100, 30],
    ['Medicina', 'curso', 'licenciatura', '6 anos', 60, 18],
    ['Engenharia Civil', 'curso', 'licenciatura', '5 anos', 80, 24],
    ['Farmácia', 'curso', 'licenciatura', '5 anos', 60, 18],
    ['Enfermagem', 'curso', 'licenciatura', '4 anos', 80, 24],
    ['Contabilidade', 'curso', 'licenciatura', '4 anos', 100, 30],
    ['Gestão', 'curso', 'licenciatura', '4 anos', 100, 30],
    ['Relações Internacionais', 'curso', 'licenciatura', '4 anos', 80, 24],
    ['Mestrado em Informática', 'curso', 'mestrado', '2 anos', 30, 9],
    ['Mestrado em Direito', 'curso', 'mestrado', '2 anos', 30, 9],
  ];
  cursosISCED.forEach(c => insertCurso.run(1, ...c));

  const cursosUJES = [
    ['Engenharia de Minas', 'curso', 'licenciatura', '5 anos', 60, 18],
    ['Arquitectura', 'curso', 'licenciatura', '5 anos', 50, 15],
    ['Engenharia Electrotécnica', 'curso', 'licenciatura', '5 anos', 60, 18],
    ['Sociologia', 'curso', 'licenciatura', '4 anos', 80, 24],
    ['Filosofia', 'curso', 'licenciatura', '4 anos', 60, 18],
  ];
  cursosUJES.forEach(c => insertCurso.run(2, ...c));

  try { db.exec('DELETE FROM calendario'); } catch(e) {}
  const insertCal = db.prepare('INSERT INTO calendario (titulo, descricao, data_inicio, data_fim, tipo, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)');
  insertCal.run('Início das Aulas', 'Início do ano lectivo 2025/2026', '2025-09-15', '2025-09-15', 'inicio', 2026);
  insertCal.run('Férias de Natal', 'Recesso de Natal e Ano Novo', '2025-12-20', '2026-01-05', 'ferias', 2026);
  insertCal.run('Férias de Carnaval', 'Recesso de Carnaval', '2026-02-14', '2026-02-18', 'ferias', 2026);
  insertCal.run('Exames Finais', 'Período de exames finais', '2026-05-20', '2026-06-15', 'exame', 2026);
  insertCal.run('Fecho do Ano Lectivo', 'Entrega de resultados e encerramento', '2026-07-01', '2026-07-05', 'fim', 2026);

  const insertInfo = db.prepare('INSERT INTO informacoes_instituicao (instituicao_id, horario_atendimento, dias_atendimento, documentos_necessarios, procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria, email_secretaria, website, notas_admissionais) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  const infoConfigs = [
    { instId: 1, horario: '08:00 - 16:00', docs: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico', procs: 'Inscrição online. Documentos na secretaria.', rupe: 'AO06 0040 0000 8080 0001 1011 3', tel: '241 234 567', email: 'secretaria@isced-huambo.ao', website: 'https://isced-huambo.ao', notas: 'Exames de acesso: Matemática, Física, Português.' },
    { instId: 2, horario: '08:00 - 16:00', docs: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico, Pasta', procs: 'Submeter candidatura online.', rupe: 'AO06 0040 0000 8080 0001 2012 1', tel: '241 234 000', email: 'secretaria@ujes.ao', website: 'https://ujes.ao', notas: 'Notas mínimas variam por curso.' },
  ];
  infoConfigs.forEach(c => insertInfo.run(c.instId, c.horario, 'Segunda a Sexta', c.docs, c.procs, c.rupe, c.tel, c.email, c.website, c.notas));

  console.log('Seed completo!');
}

module.exports = { seedDatabase };
