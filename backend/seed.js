const db = require('./config/database');
const bcrypt = require('bcryptjs');
const initDatabase = require('./config/init-db');

const seedDatabase = async () => {
  await db.ready;
  initDatabase();
  console.log('Iniciando seed do banco de dados...');

  db.exec('DELETE FROM pagamentos');
  db.exec('DELETE FROM solicitacoes');
  db.exec('DELETE FROM comunicados');
  db.exec('DELETE FROM notas');
  db.exec('DELETE FROM matriculas');
  db.exec('DELETE FROM turmas');
  db.exec('DELETE FROM disciplinas');
  db.exec('DELETE FROM professores');
  db.exec('DELETE FROM alunos');
  db.exec('DELETE FROM encarregados');
  db.exec('DELETE FROM alertas');
  db.exec('DELETE FROM estatisticas');
  db.exec('DELETE FROM noticias');
  db.exec('DELETE FROM usuarios');
  db.exec('DELETE FROM calendario');
  db.exec('DELETE FROM cursos');
  db.exec('DELETE FROM informacoes_instituicao');
  db.exec('DELETE FROM instituicoes');
  db.exec('DELETE FROM municipios');
  db.exec('DELETE FROM provincias');

  const insertProvincia = db.prepare('INSERT OR IGNORE INTO provincias (nome, codigo) VALUES (?, ?)');
  insertProvincia.run('Huambo', 'HUA');

  const municipios = ['Huambo', 'Caála', 'Bailundo', 'Ekunha', 'Longonjo', 'Londuimbali', 'Mungo'];
  const insertMunicipio = db.prepare('INSERT OR IGNORE INTO municipios (nome, provincia_id) SELECT ?, id FROM provincias WHERE codigo = ?');
  for (const m of municipios) {
    insertMunicipio.run(m, 'HUA');
  }

  // Todas as escolas reais com coordenadas GPS - 4 níveis: Pré-Escolar, Primário, Médio, Superior
  const instituicoes = [
    // ENSINO SUPERIOR
    { nome: 'Faculdade de Economia (UJES)', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.79815, lng: 15.73324, vagas: 500 },
    { nome: 'Faculdade de Direito (UJES)', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.79950, lng: 15.73410, vagas: 400 },
    { nome: 'Instituto Superior de Ciências da Educação do Huambo (ISCED)', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.77475, lng: 15.74914, vagas: 600 },
    { nome: 'Instituto Superior Politécnico da Caála', tipo: 'ensino_superior', municipio: 'Caála', lat: -12.85732, lng: 15.55621, vagas: 600 },
    { nome: 'Instituto Superior Politécnico Católico do Huambo (ISPOCHBO)', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.77581, lng: 15.72912, vagas: 450 },
    { nome: 'Instituto Superior Politécnico Lusíada do Huambo', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.76632, lng: 15.74850, vagas: 500 },
    { nome: 'ISUPE - Inst. Sup. Politécnico Ekuikui II', tipo: 'ensino_superior', municipio: 'Huambo', lat: -12.76815, lng: 15.72590, vagas: 350 },

    // ENSINO MÉDIO
    { nome: 'Complexo Escolar Privado Politécnico do Huambo', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.77120, lng: 15.74415, vagas: 800 },
    { nome: 'Complexo Escolar nº 34 - Augusto Ngangula', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.76750, lng: 15.72480, vagas: 750 },
    { nome: 'Complexo Escolar Privado Huambo Calunga II', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.78440, lng: 15.72110, vagas: 650 },
    { nome: 'Liceu do Huambo (Antiga Escola Secundária)', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.77910, lng: 15.73890, vagas: 1000 },
    { nome: 'Instituto Politécnico de Administração e Gestão (IPAG)', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.78320, lng: 15.74150, vagas: 400 },
    { nome: 'Instituto Politécnico Privado 7 Cores', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.78865, lng: 15.74124, vagas: 350 },
    { nome: 'Complexo Escolar Privado Politécnico Namunga', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.78051, lng: 15.73949, vagas: 400 },
    { nome: 'IGCA (Colégio)', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.77733, lng: 15.73537, vagas: 500 },
    { nome: 'Complexo Escolar Rei Livongue', tipo: 'ensino_medio', municipio: 'Huambo', lat: -12.76869, lng: 15.72862, vagas: 450 },

    // ENSINO PRIMÁRIO
    { nome: 'Escola Primária Nº 53', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.77150, lng: 15.74985, vagas: 300 },
    { nome: 'Escola Primária Nº 111 Benfica', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.75407, lng: 15.74315, vagas: 250 },
    { nome: 'Escola de Ensino Primário Nº 105 Chiva', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.73647, lng: 15.78871, vagas: 200 },
    { nome: 'Escola Primária Nº 32', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.77674, lng: 15.74200, vagas: 280 },
    { nome: 'Escola São José de Cluny', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.77044, lng: 15.80751, vagas: 300 },
    { nome: 'Escola Primária Cangombe', tipo: 'ensino_primario', municipio: 'Bailundo', lat: -12.19056, lng: 15.84945, vagas: 200 },
    { nome: 'Escola Comandante Dangereux (Capango)', tipo: 'ensino_primario', municipio: 'Huambo', lat: -12.76105, lng: 15.75780, vagas: 350 },

    // PRÉ-ESCOLAR
    { nome: 'Jardim de Infância Nossa Senhora de Fátima', tipo: 'pre_escolar', municipio: 'Huambo', lat: -12.77350, lng: 15.73120, vagas: 120 },
    { nome: 'Jardim de Infância do ISCED', tipo: 'pre_escolar', municipio: 'Huambo', lat: -12.77510, lng: 15.74880, vagas: 80 },
    { nome: 'Jardim de Infância Santa Ana', tipo: 'pre_escolar', municipio: 'Huambo', lat: -12.78230, lng: 15.73650, vagas: 100 },
    { nome: 'Jardim de Infância São José', tipo: 'pre_escolar', municipio: 'Caála', lat: -12.85600, lng: 15.55780, vagas: 90 },
    { nome: 'Jardim de Infância Comunitário Bailundo', tipo: 'pre_escolar', municipio: 'Bailundo', lat: -12.19100, lng: 15.84800, vagas: 70 },
  ];

  const insertInstituicao = db.prepare(`
    INSERT OR IGNORE INTO instituicoes (nome, tipo, municipio_id, latitude, longitude, vagas_totais, vagas_disponiveis)
    SELECT ?, ?, m.id, ?, ?, ?, ?
    FROM municipios m WHERE m.nome = ?
  `);

  for (const i of instituicoes) {
    const vagasOcupadas = Math.floor(i.vagas * 0.65);
    insertInstituicao.run(i.nome, i.tipo, i.lat, i.lng, i.vagas, i.vagas - vagasOcupadas, i.municipio);
  }

  const senhaHash = await bcrypt.hash('123456', 10);
  const insertUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (username, password, perfil, entidade_id, entidade_tipo, nome, email, telefone, is_gestor, aprovado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertUsuario.run('admin', senhaHash, 'admin', null, null, 'Administrador do Sistema', 'admin@sime.ao', '923000000', 0, 1);

  const insertNoticia = db.prepare(`INSERT OR IGNORE INTO noticias (titulo, resumo, conteudo, categoria, imagem_url, autor, destaque) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertNoticia.run(
    'Inicio do Ano Lectivo 2026/2027',
    'O ano lectivo 2026/2027 inicia-se no dia 4 de Setembro.',
    'O Ministério da Educação informa que o ano lectivo 2026/2027 inicia-se oficialmente no dia 4 de Setembro.',
    'aviso', null, 'SIME', 1
  );

  // Utilizadores de teste - Instituições (aprovadas e pendentes)
  const instituicoesData = db.prepare('SELECT id, nome FROM instituicoes LIMIT 5').all();
  
  if (instituicoesData.length >= 2) {
    // Gestores de instituições aprovados
    insertUsuario.run('escola.huambo', senhaHash, 'instituicao', instituicoesData[0].id, 'instituicao', 'Gestor Escola Huambo', 'escola@sime.ao', '923111111', 1, 1);
    insertUsuario.run('escola.caala', senhaHash, 'instituicao', instituicoesData[1].id, 'instituicao', 'Gestor Escola Caála', 'caala@sime.ao', '923222222', 1, 1);
    
    // Gestor pendente de aprovação
    insertUsuario.run('escola.pendente', senhaHash, 'instituicao', instituicoesData.length >= 3 ? instituicoesData[2].id : null, 'instituicao', 'Gestor Pendente', 'pendente@sime.ao', '923333333', 1, 0);
  }

  // Encarregados de teste
  const insertEncarregado = db.prepare('INSERT OR IGNORE INTO encarregados (nome_completo, bi, telefone, email, endereco, profissao) VALUES (?, ?, ?, ?, ?, ?)');
  insertEncarregado.run('Pedro Santos', '001234567LA045', '923444444', 'pedro@email.com', 'Rua 1, Huambo', 'Engenheiro');
  insertEncarregado.run('Maria José', '001234568LA045', '923555555', 'maria@email.com', 'Rua 2, Huambo', 'Professora');
  insertEncarregado.run('Ana Paula', '001234569LA045', '923666666', 'ana@email.com', 'Rua 3, Huambo', 'Médica');

  const encarregadosData = db.prepare('SELECT id FROM encarregados').all();

  // Utilizadores encarregados aprovados
  if (encarregadosData.length >= 2) {
    insertUsuario.run('encarregado1', senhaHash, 'encarregado', encarregadosData[0].id, 'encarregado', 'Pedro Santos', 'pedro@email.com', '923444444', 0, 1);
    insertUsuario.run('encarregado2', senhaHash, 'encarregado', encarregadosData[1].id, 'encarregado', 'Maria José', 'maria@email.com', '923555555', 0, 1);
  }

  // Professores de teste
  if (instituicoesData.length >= 2) {
    const insertProfessor = db.prepare('INSERT OR IGNORE INTO professores (nome_completo, bi, data_nascimento, telefone, email, formacao, especialidade, numero_funcionario, instituicao_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertProfessor.run('João Silva', '009876543LA045', '1985-03-15', '923777777', 'joao@email.com', 'Licenciatura', 'Matemática', 'PROF001', instituicoesData[0].id);
    insertProfessor.run('Maria Fernanda', '009876544LA045', '1990-07-22', '923888888', 'fernanda@email.com', 'Mestrado', 'Português', 'PROF002', instituicoesData[0].id);
    insertProfessor.run('Carlos André', '009876545LA045', '1988-11-10', '923999999', 'carlos@email.com', 'Licenciatura', 'História', 'PROF003', instituicoesData[1].id);
  }

  // Turmas de teste
  const professoresData = db.prepare('SELECT id, instituicao_id FROM professores').all();
  if (professoresData.length >= 2) {
    const insertTurma = db.prepare('INSERT OR IGNORE INTO turmas (nome, ano_letivo, nivel, instituicao_id, professor_titular_id, vagas, vagas_ocupadas) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertTurma.run('1ª Classe A', 2026, '1ª Classe', professoresData[0].instituicao_id, professoresData[0].id, 40, 32);
    insertTurma.run('1ª Classe B', 2026, '1ª Classe', professoresData[0].instituicao_id, professoresData[1].id, 40, 28);
    insertTurma.run('2ª Classe A', 2026, '2ª Classe', professoresData[0].instituicao_id, professoresData[0].id, 35, 30);
    insertTurma.run('1ª Classe A', 2026, '1ª Classe', professoresData[1].instituicao_id, professoresData[2].id, 40, 25);
  }

  // Alunos de teste
  if (encarregadosData.length >= 2 && instituicoesData.length >= 2) {
    const insertAluno = db.prepare('INSERT OR IGNORE INTO alunos (nome_completo, data_nascimento, sexo, naturalidade, numero_estudante, encarregado_id, instituicao_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertAluno.run('Pedro Neto', '2015-05-10', 'M', 'Huambo', 'ALU001', encarregadosData[0].id, instituicoesData[0].id);
    insertAluno.run('Ana Neto', '2016-08-20', 'F', 'Huambo', 'ALU002', encarregadosData[0].id, instituicoesData[0].id);
    insertAluno.run('Maria Filha', '2015-03-15', 'F', 'Huambo', 'ALU003', encarregadosData[1].id, instituicoesData[0].id);
    insertAluno.run('João Filho', '2016-01-25', 'M', 'Caála', 'ALU004', encarregadosData[1].id, instituicoesData[1].id);
  }

  // Matrículas de teste
  const alunosData = db.prepare('SELECT id, instituicao_id FROM alunos').all();
  const turmasData = db.prepare('SELECT id, instituicao_id FROM turmas').all();
  if (alunosData.length >= 2 && turmasData.length >= 2) {
    const insertMatricula = db.prepare('INSERT OR IGNORE INTO matriculas (aluno_id, turma_id, ano_letivo, estado) VALUES (?, ?, ?, ?)');
    insertMatricula.run(alunosData[0].id, turmasData[0].id, 2026, 'ativa');
    insertMatricula.run(alunosData[1].id, turmasData[1].id, 2026, 'ativa');
    if (alunosData.length >= 3) insertMatricula.run(alunosData[2].id, turmasData[0].id, 2026, 'ativa');
  }

  // Solicitações de teste
  if (encarregadosData.length >= 2 && instituicoesData.length >= 2) {
    const insertSolicitacao = db.prepare('INSERT OR IGNORE INTO solicitacoes (encarregado_id, instituicao_id, aluno_nome, aluno_data_nascimento, aluno_sexo, estado) VALUES (?, ?, ?, ?, ?, ?)');
    insertSolicitacao.run(encarregadosData[0].id, instituicoesData[0].id, 'Novo Aluno 1', '2016-05-10', 'M', 'pendente');
    insertSolicitacao.run(encarregadosData[1].id, instituicoesData[1].id, 'Novo Aluno 2', '2015-09-20', 'F', 'aceite');
  }

  // Calendário lectivo
  const insertCalendario = db.prepare('INSERT OR IGNORE INTO calendario (titulo, data_inicio, data_fim, tipo, descricao, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)');
  insertCalendario.run('Início do Ano Lectivo', '2026-09-04', null, 'inicio', 'Início oficial das aulas', 2026);
  insertCalendario.run('1º Período', '2026-09-04', '2026-12-15', 'evento', 'Primeiro período lectivo', 2026);
  insertCalendario.run('Férias de Natal', '2026-12-16', '2027-01-05', 'ferias', 'Férias de fim de ano', 2026);
  insertCalendario.run('2º Período', '2027-01-06', '2027-03-31', 'evento', 'Segundo período lectivo', 2027);
  insertCalendario.run('Exames Nacionais', '2027-04-01', '2027-04-30', 'exame', 'Período de exames nacionais', 2027);

  // Cursos para instituições superiores (tipo='curso')
  const instituicoesSuperiores = db.prepare("SELECT id, nome FROM instituicoes WHERE tipo='ensino_superior'").all();
  const insertCurso = db.prepare('INSERT INTO cursos (instituicao_id, nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (const inst of instituicoesSuperiores) {
    if (inst.nome.includes('ISCED') || inst.nome.includes('Educação')) {
      // ISCED - 10 licenciaturas + 2 mestrados
      const licenciaturas = [
        ['Licenciatura em Matemática', 'licenciatura', '4 anos', 60],
        ['Licenciatura em Física', 'licenciatura', '4 anos', 50],
        ['Licenciatura em Química', 'licenciatura', '4 anos', 50],
        ['Licenciatura em Biologia', 'licenciatura', '4 anos', 55],
        ['Licenciatura em Português', 'licenciatura', '4 anos', 70],
        ['Licenciatura em História', 'licenciatura', '4 anos', 60],
        ['Licenciatura em Geografia', 'licenciatura', '4 anos', 50],
        ['Licenciatura em Inglês', 'licenciatura', '4 anos', 65],
        ['Licenciatura em Educação Visual', 'licenciatura', '4 anos', 40],
        ['Licenciatura em Ensino Básico', 'licenciatura', '4 anos', 80],
      ];
      const mestrados = [
        ['Mestrado em Ensino da Matemática', 'mestrado', '2 anos', 25],
        ['Mestrado em Ensino do Português', 'mestrado', '2 anos', 25],
      ];
      for (const [nome, grau, dur, vagas] of licenciaturas) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.6), 'ambos');
      }
      for (const [nome, grau, dur, vagas] of mestrados) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.5), 'noturno');
      }
    } else if (inst.nome.includes('Politécnico')) {
      const cursos = [
        ['Engenharia Informática', 'licenciatura', '5 anos', 60],
        ['Gestão de Empresas', 'licenciatura', '4 anos', 70],
        ['Contabilidade', 'licenciatura', '4 anos', 55],
        ['Direito', 'licenciatura', '5 anos', 50],
        ['Enfermagem Geral', 'licenciatura', '4 anos', 50],
      ];
      for (const [nome, grau, dur, vagas] of cursos) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.55), 'ambos');
      }
    } else if (inst.nome.includes('Economia')) {
      const cursos = [
        ['Economia Geral', 'licenciatura', '4 anos', 70],
        ['Economia e Gestão', 'licenciatura', '4 anos', 60],
        ['Finanças', 'licenciatura', '4 anos', 50],
        ['Comércio Internacional', 'licenciatura', '4 anos', 45],
      ];
      for (const [nome, grau, dur, vagas] of cursos) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.6), 'diurno');
      }
    } else if (inst.nome.includes('Direito')) {
      const cursos = [
        ['Direito', 'licenciatura', '5 anos', 80],
        ['Direito Internacional', 'mestrado', '2 anos', 30],
      ];
      for (const [nome, grau, dur, vagas] of cursos) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.5), 'diurno');
      }
    } else {
      const cursos = [
        ['Engenharia Civil', 'licenciatura', '5 anos', 50],
        ['Gestão Pública', 'licenciatura', '4 anos', 40],
      ];
      for (const [nome, grau, dur, vagas] of cursos) {
        insertCurso.run(inst.id, nome, 'curso', grau, dur, vagas, Math.floor(vagas * 0.6), 'ambos');
      }
    }
  }

  // Turmas para escolas primárias e pré-escolares (tipo='turma')
  const instituicoesNaoSuperiores = db.prepare("SELECT id, tipo FROM instituicoes WHERE tipo IN ('pre_escolar', 'ensino_primario', 'ensino_medio')").all();
  const insertTurmaSeed = db.prepare('INSERT INTO cursos (instituicao_id, nome, tipo, grau, duracao, vagas_totais, vagas_disponiveis, turno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (const inst of instituicoesNaoSuperiores) {
    if (inst.tipo === 'pre_escolar') {
      const turmas = [
        ['Maternal', 'pre_escolar', '1 ano', 30],
        ['Jardim I', 'pre_escolar', '1 ano', 30],
        ['Jardim II', 'pre_escolar', '1 ano', 30],
      ];
      for (const [nome, grau, dur, vagas] of turmas) {
        insertTurmaSeed.run(inst.id, nome, 'turma', grau, dur, vagas, Math.floor(vagas * 0.7), 'diurno');
      }
    } else if (inst.tipo === 'ensino_primario') {
      const turmas = [
        ['1ª Classe', '1_ciclo', '1 ano', 40],
        ['2ª Classe', '1_ciclo', '1 ano', 40],
        ['3ª Classe', '1_ciclo', '1 ano', 40],
        ['4ª Classe', '1_ciclo', '1 ano', 40],
        ['5ª Classe', '2_ciclo', '1 ano', 40],
        ['6ª Classe', '2_ciclo', '1 ano', 40],
      ];
      for (const [nome, grau, dur, vagas] of turmas) {
        insertTurmaSeed.run(inst.id, nome, 'turma', grau, dur, vagas, Math.floor(vagas * 0.65), 'diurno');
      }
    } else if (inst.tipo === 'ensino_medio') {
      const turmas = [
        ['7ª Classe', 'ensino_medio', '1 ano', 45],
        ['8ª Classe', 'ensino_medio', '1 ano', 45],
        ['9ª Classe', 'ensino_medio', '1 ano', 45],
        ['10ª Classe', 'ensino_medio', '1 ano', 45],
        ['11ª Classe', 'ensino_medio', '1 ano', 45],
        ['12ª Classe', 'ensino_medio', '1 ano', 45],
      ];
      for (const [nome, grau, dur, vagas] of turmas) {
        insertTurmaSeed.run(inst.id, nome, 'turma', grau, dur, vagas, Math.floor(vagas * 0.6), 'diurno');
      }
    }
  }

  // Informações de instituições
  const insertInfo = db.prepare(`INSERT INTO informacoes_instituicao (instituicao_id, horario_atendimento, dias_atendimento, documentos_necessarios, procedimentos_inscricao, taxa_reserva_rupe, telefone_secretaria, email_secretaria, website, notas_admissionais) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const inst of instituicoesSuperiores) {
    const infoPorTipo = {
      'ISCED': {
        horario: '08:00 - 15:00',
        docs: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico, Pasta de Processo, Documento de Candidatura',
        procs: 'Submeter documentos no Portal do Estudante ou presencialmente. Acompanhar prazos de exames de acesso conforme calendário do MESCTI.',
        rupe: 'AO06 0040 0000 8080 0001 1011 6',
        website: 'https://isced-huambo.ao',
        notas: 'Exames de acesso: Matemática, Física, Português. Nota mínima de candidatura: 10 valores.'
      },
      'Politécnico': {
        horario: '08:00 - 14:00',
        docs: 'Bilhete de Identidade, Certificado da 12ª Classe, 4 Fotos, Atestado Médico, Pasta de Processo',
        procs: 'Entregar documentos na secretaria académica. Acompanhar prazos no portal da instituição.',
        rupe: 'AO06 0040 0000 8080 0001 2012 8',
        website: 'https://ispc-huambo.ao',
        notas: 'Cursos com vagas limitadas. Processo seletivo por nota do certificado.'
      },
      'Economia': {
        horario: '08:00 - 14:00',
        docs: 'Bilhete de Identidade, Certificado da 12ª Classe, 4 Fotos, Atestado Médico, Pasta de Processo',
        procs: 'Inscrição online ou presencial. Documentos na secretaria até à data limite.',
        rupe: 'AO06 0040 0000 8080 0001 3013 5',
        website: 'https://fajes-huambo.ao',
        notas: 'Exames de acesso: Matemática, Economia, Português.'
      },
      'Direito': {
        horario: '08:00 - 14:00',
        docs: 'Bilhete de Identidade, Certificado da 12ª/13ª Classe, 4 Fotos, Atestado Médico, Pasta de Processo',
        procs: 'Submeter candidatura no portal. Participar nos exames de acesso presenciais.',
        rupe: 'AO06 0040 0000 8080 0001 4014 2',
        website: 'https://fjd-huambo.ao',
        notas: 'Exames de acesso: História, Português, Direito. Nota mínima: 10 valores.'
      },
    };

    let config = null;
    for (const [key, val] of Object.entries(infoPorTipo)) {
      if (inst.nome.includes(key)) { config = val; break; }
    }
    if (!config) config = infoPorTipo['Politécnico'];

    insertInfo.run(inst.id, config.horario, 'Segunda a Sexta', config.docs, config.procs, config.rupe, inst.nome.includes('ISCED') ? '241 234 567' : '241 234 000', `secretaria@${inst.nome.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10)}.ao`, config.website, config.notas);
  }

  console.log('Seed do banco de dados concluído com sucesso!');
};

seedDatabase().catch(console.error);
