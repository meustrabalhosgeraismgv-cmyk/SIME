const db = require('./database');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provincias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS municipios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      provincia_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provincia_id) REFERENCES provincias(id)
    );

    CREATE TABLE IF NOT EXISTS instituicoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('pre_escolar', 'ensino_primario', 'ensino_medio', 'ensino_superior')),
      endereco TEXT,
      telefone TEXT,
      email TEXT,
      responsavel TEXT,
      latitude REAL,
      longitude REAL,
      vagas_totais INTEGER DEFAULT 0,
      vagas_disponiveis INTEGER DEFAULT 0,
      vagas_esgotadas INTEGER GENERATED ALWAYS AS (vagas_totais - vagas_disponiveis) STORED,
      logotipo_url TEXT,
      imagem_url TEXT,
      lema TEXT,
      descricao TEXT,
      aceita_inscricao_online INTEGER DEFAULT 0,
      aceita_inscricao_presencial INTEGER DEFAULT 1,
      taxa_inscricao REAL DEFAULT 0,
      taxa_matricula REAL DEFAULT 0,
      status TEXT DEFAULT 'ativa' CHECK(status IN ('ativa', 'inativa', 'em_reforma', 'pendente')),
      municipio_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (municipio_id) REFERENCES municipios(id)
    );

    CREATE TABLE IF NOT EXISTS encarregados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      bi TEXT UNIQUE NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      endereco TEXT,
      profissao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      data_nascimento DATE NOT NULL,
      sexo TEXT NOT NULL CHECK(sexo IN ('M', 'F')),
      naturalidade TEXT,
      numero_estudante TEXT UNIQUE NOT NULL,
      encarregado_id INTEGER,
      instituicao_id INTEGER NOT NULL,
      estado TEXT DEFAULT 'ativo' CHECK(estado IN ('ativo', 'transferido', 'abandono', 'concluido')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (encarregado_id) REFERENCES encarregados(id),
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );

    CREATE TABLE IF NOT EXISTS professores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      bi TEXT UNIQUE NOT NULL,
      data_nascimento DATE,
      telefone TEXT,
      email TEXT,
      formacao TEXT,
      especialidade TEXT,
      numero_funcionario TEXT UNIQUE NOT NULL,
      instituicao_id INTEGER NOT NULL,
      estado TEXT DEFAULT 'ativo' CHECK(estado IN ('ativo', 'afastado', 'aposentado')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );

    CREATE TABLE IF NOT EXISTS disciplinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo TEXT UNIQUE NOT NULL,
      carga_horaria INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      ano_letivo INTEGER NOT NULL,
      nivel TEXT NOT NULL,
      instituicao_id INTEGER NOT NULL,
      professor_titular_id INTEGER,
      vagas INTEGER DEFAULT 40,
      vagas_ocupadas INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id),
      FOREIGN KEY (professor_titular_id) REFERENCES professores(id)
    );

    CREATE TABLE IF NOT EXISTS matriculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      turma_id INTEGER NOT NULL,
      ano_letivo INTEGER NOT NULL,
      data_matricula DATE DEFAULT CURRENT_DATE,
      estado TEXT DEFAULT 'ativa' CHECK(estado IN ('ativa', 'cancelada', 'concluida')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id),
      FOREIGN KEY (turma_id) REFERENCES turmas(id),
      UNIQUE(aluno_id, turma_id, ano_letivo)
    );

    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER NOT NULL,
      disciplina_id INTEGER NOT NULL,
      nota_continua REAL DEFAULT 0,
      nota_prova INTEGER DEFAULT 0,
      nota_final REAL GENERATED ALWAYS AS (nota_continua * 0.4 + nota_prova * 0.6) STORED,
      periodo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'instituicao', 'encarregado')),
      nome TEXT,
      email TEXT,
      telefone TEXT,
      is_gestor INTEGER DEFAULT 0,
      entidade_id INTEGER,
      entidade_tipo TEXT,
      aprovado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alertas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('info', 'aviso', 'erro', 'sucesso')),
      lido INTEGER DEFAULT 0,
      usuario_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS estatisticas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      dados JSON NOT NULL,
      data_consulta DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      resumo TEXT,
      conteudo TEXT,
      categoria TEXT DEFAULT 'geral' CHECK(categoria IN ('geral', 'educacao', 'aviso', 'evento', 'edital', 'circular')),
      imagem_url TEXT,
      autor TEXT DEFAULT 'SIME',
      instituicao_id INTEGER,
      destaque INTEGER DEFAULT 0,
      publicada INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );

    CREATE TABLE IF NOT EXISTS comunicados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('aviso', 'inscricao', 'matricula', 'exame', 'evento', 'geral')),
      instituicao_id INTEGER NOT NULL,
      valor REAL DEFAULT 0,
      data_inicio_inscricao DATE,
      data_fim_inscricao DATE,
      vagas_reservadas INTEGER DEFAULT 0,
      publicado INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );

    CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encarregado_id INTEGER NOT NULL,
      instituicao_id INTEGER NOT NULL,
      comunicado_id INTEGER,
      aluno_nome TEXT NOT NULL,
      aluno_data_nascimento DATE,
      aluno_sexo TEXT,
      estado TEXT DEFAULT 'pendente' CHECK(estado IN ('pendente', 'aceite', 'rejeitada', 'inscrito', 'agendado')),
      data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_resposta DATETIME,
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (encarregado_id) REFERENCES encarregados(id),
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id),
      FOREIGN KEY (comunicado_id) REFERENCES comunicados(id)
    );

    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      solicitacao_id INTEGER NOT NULL,
      instituicao_id INTEGER NOT NULL,
      encarregado_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('reserva', 'inscricao', 'matricula')),
      estado TEXT DEFAULT 'pendente' CHECK(estado IN ('pendente', 'pago', 'cancelado', 'expirado')),
      data_limite DATETIME,
      data_pagamento DATETIME,
      recibo_numero TEXT,
      comprovativo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id),
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id),
      FOREIGN KEY (encarregado_id) REFERENCES encarregados(id)
    );

    CREATE TABLE IF NOT EXISTS calendario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data_inicio DATE NOT NULL,
      data_fim DATE,
      tipo TEXT NOT NULL CHECK(tipo IN ('inicio', 'fim', 'ferias', 'exame', 'evento')),
      descricao TEXT,
      ano_letivo INTEGER DEFAULT 2026,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cols = db.prepare("PRAGMA table_info(usuarios)").all();
  if (!cols.find(c => c.name === 'foto')) {
    db.exec("ALTER TABLE usuarios ADD COLUMN foto TEXT DEFAULT NULL");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instituicao_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'curso' CHECK(tipo IN ('turma', 'curso')),
      grau TEXT NOT NULL DEFAULT 'licenciatura' CHECK(grau IN ('pre_escolar', '1_ciclo', '2_ciclo', 'ensino_medio', 'tecnico', 'licenciatura', 'mestrado', 'doutorado')),
      duracao TEXT,
      vagas_totais INTEGER DEFAULT 0,
      vagas_disponiveis INTEGER DEFAULT 0,
      turno TEXT DEFAULT 'diurno' CHECK(turno IN ('diurno', 'noturno', 'ambos')),
      estado TEXT DEFAULT 'ativo' CHECK(estado IN ('ativo', 'inativo', 'lotado')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );

    CREATE TABLE IF NOT EXISTS informacoes_instituicao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instituicao_id INTEGER UNIQUE NOT NULL,
      horario_atendimento TEXT DEFAULT '08:00 - 15:00',
      dias_atendimento TEXT DEFAULT 'Segunda a Sexta',
      documentos_necessarios TEXT,
      procedimentos_inscricao TEXT,
      taxa_reserva_rupe TEXT,
      telefone_secretaria TEXT,
      email_secretaria TEXT,
      endereco_secretaria TEXT,
      website TEXT,
      link_portal_estudante TEXT,
      notas_admissionais TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
    );
  `);

  const infoCols = db.prepare("PRAGMA table_info(informacoes_instituicao)").all();
  if (!infoCols.find(c => c.name === 'notas_admissionais')) {
    try { db.exec("ALTER TABLE informacoes_instituicao ADD COLUMN notas_admissionais TEXT"); } catch(e) {}
  }

  const cursoCols = db.prepare("PRAGMA table_info(cursos)").all();
  if (!cursoCols.find(c => c.name === 'tipo')) {
    try { db.exec("ALTER TABLE cursos ADD COLUMN tipo TEXT DEFAULT 'curso' CHECK(tipo IN ('turma', 'curso'))"); } catch(e) {}
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('privada', 'grupo')),
      nome TEXT,
      descricao TEXT,
      criado_por INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (criado_por) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS conversa_participantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversa_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      cargo TEXT DEFAULT 'membro' CHECK(cargo IN ('admin', 'moderador', 'membro')),
      lido_ate DATETIME DEFAULT CURRENT_TIMESTAMP,
      notificado INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      UNIQUE(conversa_id, usuario_id)
    );

    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversa_id INTEGER NOT NULL,
      remetente_id INTEGER NOT NULL,
      conteudo TEXT NOT NULL,
      tipo TEXT DEFAULT 'texto' CHECK(tipo IN ('texto', 'imagem', 'sistema', 'ficheiro')),
      ficheiro_url TEXT,
      respondendo_a INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
      FOREIGN KEY (remetente_id) REFERENCES usuarios(id),
      FOREIGN KEY (respondendo_a) REFERENCES mensagens(id)
    );

    CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_conversa_part ON conversa_participantes(usuario_id);
  `);

  console.log('Base de dados inicializada com sucesso!');
};

module.exports = initDatabase;
