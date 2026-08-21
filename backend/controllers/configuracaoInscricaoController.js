const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

const ciclos = {
  primario: { nome: 'Ensino Primário', niveis: ['1a_classe', '2a_classe', '3a_classe', '4a_classe', '5a_classe', '6a_classe'] },
  secundario: { nome: 'I Ciclo do Ensino Secundário', niveis: ['7a_classe', '8a_classe', '9a_classe'] },
  medio: { nome: 'Ensino Médio (II Ciclo)', niveis: ['10a_classe', '11a_classe', '12a_classe'] }
};

const requisitosPadrao = {
  primario: [
    { chave: 'doc_identificacao_aluno', nome: 'Documento de Identificação do Aluno', descricao: 'BI, Cédula Pessoal ou Certidão de Nascimento', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: 'Fotos do Aluno', descricao: '2 fotos tipo passe', obrigatorio: true, aceita_pdf: false },
    { chave: 'doc_saude', nome: 'Documento de Saúde', descricao: 'Cartão de vacinas', obrigatorio: true, aceita_pdf: true },
    { chave: 'doc_academico', nome: 'Documento Académico', descricao: 'Boletim ou declaração da escola anterior', obrigatorio: true, aceita_pdf: true },
    { chave: 'formulario', nome: 'Formulário de Inscrição', descricao: 'Ficha de inscrição interna da escola', obrigatorio: true, aceita_pdf: true }
  ],
  secundario: [
    { chave: 'doc_identificacao_aluno', nome: 'Documento de Identificação do Aluno', descricao: 'BI ou Certidão de Nascimento', obrigatorio: true, aceita_pdf: true },
    { chave: 'doc_academico_conclusao', nome: 'Certificado de Conclusão', descricao: 'Certificado da 6ª classe', obrigatorio: true, aceita_pdf: true },
    { chave: 'doc_academico_historico', nome: 'Histórico Escolar', descricao: 'Boletim de notas', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: 'Fotos do Aluno', descricao: '2 fotos tipo passe', obrigatorio: true, aceita_pdf: false },
    { chave: 'formulario', nome: 'Formulário de Inscrição', descricao: 'Ficha de inscrição interna da escola', obrigatorio: true, aceita_pdf: true }
  ],
  medio: [
    { chave: 'doc_identificacao_aluno', nome: 'Documento de Identificação do Aluno', descricao: 'BI obrigatório', obrigatorio: true, aceita_pdf: true },
    { chave: 'doc_identificacao_encarregado', nome: 'Documento de Identificação do Encarregado', descricao: 'BI do responsável', obrigatorio: true, aceita_pdf: true },
    { chave: 'doc_academico_conclusao', nome: 'Certificado de Conclusão', descricao: 'Certificado da 9ª classe', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: 'Fotos do Aluno', descricao: '2 fotos tipo passe', obrigatorio: true, aceita_pdf: false },
    { chave: 'doc_exame', nome: 'Ficha para Exame de Admissão', descricao: 'Ficha de candidatura ao exame de admissão', obrigatorio: true, aceita_pdf: true }
  ]
};

function cicloDeNivel(nivel) {
  if (!nivel) return 'primario';
  if (ciclos.primario.niveis.includes(nivel)) return 'primario';
  if (ciclos.secundario.niveis.includes(nivel)) return 'secundario';
  return 'medio';
}

function gerarRequisitos(ciclo) {
  return requisitosPadrao[ciclo] || requisitosPadrao.primario;
}

function formularioPadrao() {
  return { modo: 'online', modelo_url: null, modelo_nome: null, campos: [] };
}

async function getConfigDoc(db, instituicaoId) {
  return db.collection('configuracoes_inscricao').findOne({ instituicao_id: new ObjectId(instituicaoId) });
}

function toId(doc) {
  if (!doc) return null;
  return { ...doc, id: String(doc._id) };
}

exports.getPublica = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const instituicao = await db.collection('instituicoes').findOne({ _id: new ObjectId(instituicaoId) });
    if (!instituicao) return res.status(404).json({ error: 'Instituição não encontrada' });

    const config = await getConfigDoc(db, instituicaoId);
    if (config && config.estado === 'aprovada') {
      return res.json({ data: toId(config) });
    }

    const ciclosResumo = Object.keys(ciclos).map((chave) => ({
      ciclo: chave,
      nome: ciclos[chave].nome,
      niveis: ciclos[chave].niveis,
      requisitos: gerarRequisitos(chave)
    }));

    res.json({
      data: {
        id: null,
        instituicao_id: String(instituicao._id),
        ciclos: ciclosResumo,
        formulario: formularioPadrao(),
        estado: 'padrao',
        origem: 'padrao'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar requisitos de inscrição' });
  }
};

exports.getMinha = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const config = await getConfigDoc(db, instituicaoId);
    if (!config) {
      const ciclosResumo = Object.keys(ciclos).map((chave) => ({
        ciclo: chave,
        nome: ciclos[chave].nome,
        niveis: ciclos[chave].niveis,
        requisitos: gerarRequisitos(chave)
      }));
      return res.json({ data: { id: null, instituicao_id: String(instituicaoId), ciclos: ciclosResumo, formulario: formularioPadrao(), estado: 'padrao' } });
    }
    res.json({ data: toId(config) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar requisitos de inscrição' });
  }
};

exports.gerarComAssistente = async (req, res) => {
  try {
    const { instituicao_id, ciclos_selecionados } = req.body;
    if (!instituicao_id) return res.status(400).json({ error: 'instituicao_id é obrigatório' });

    const db = getDB();
    const instituicao = await db.collection('instituicoes').findOne({ _id: matchId(instituicao_id) });
    if (!instituicao) return res.status(404).json({ error: 'Instituição não encontrada' });

    const alvos = Array.isArray(ciclos_selecionados) && ciclos_selecionados.length
      ? ciclos_selecionados
      : Object.keys(ciclos);

    const ciclosGerados = alvos.map((chave) => ({
      ciclo: chave,
      nome: ciclos[chave]?.nome || chave,
      niveis: ciclos[chave]?.niveis || [],
      requisitos: gerarRequisitos(chave)
    }));

    res.json({
      data: {
        instituicao_id: String(instituicao._id),
        ciclos: ciclosGerados,
        origem: 'assistente',
        mensagem: 'Requisitos gerados pelo assistente com base no ensino e nível. Reveja, ajuste se necessário e guarde.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar requisitos' });
  }
};

exports.salvar = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const { ciclos, estado, formulario } = req.body;
    if (!Array.isArray(ciclos) || ciclos.length === 0) {
      return res.status(400).json({ error: 'É necessário definir pelo menos um ciclo' });
    }

    const formularioSalvo = formulario && typeof formulario === 'object'
      ? {
          modo: formulario.modo === 'modelo' ? 'modelo' : 'online',
          modelo_url: formulario.modelo_url || null,
          modelo_nome: formulario.modelo_nome || null,
          campos: Array.isArray(formulario.campos) ? formulario.campos : []
        }
      : formularioPadrao();

    const now = new Date();
    const update = {
      $set: {
        ciclos,
        formulario: formularioSalvo,
        estado: estado === 'aprovada' ? 'aprovada' : 'rascunho',
        atualizado_por: new ObjectId(req.user.id),
        updated_at: now
      },
      $setOnInsert: { created_at: now }
    };

    await db.collection('configuracoes_inscricao').findOneAndUpdate(
      { instituicao_id: new ObjectId(instituicaoId) },
      update,
      { upsert: true }
    );

    const saved = await getConfigDoc(db, instituicaoId);
    res.json({ data: toId(saved), message: 'Configuração guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar configuração' });
  }
};

exports.aprovar = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const config = await getConfigDoc(db, instituicaoId);
    if (!config || !Array.isArray(config.ciclos) || config.ciclos.length === 0) {
      return res.status(400).json({ error: 'Guarde a configuração antes de aprovar' });
    }

    const instituicao = await db.collection('instituicoes').findOne({ _id: new ObjectId(instituicaoId) });
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const autor = usuario?.nome || usuario?.username || 'Instituição';

    const itens = config.ciclos.flatMap((c) =>
      (c.requisitos || []).map((r) => `${r.nome}${r.obrigatorio ? '' : ' (opcional)'}`)
    );
    const resumo = itens.slice(0, 8).join(', ') + (itens.length > 8 ? '...' : '');

    const comunicado = {
      titulo: `Requisitos de admissão — ${instituicao?.nome || 'Instituição'}`,
      conteudo: `A instituição ${instituicao?.nome || ''} definiu os requisitos de admissão, inscrição e matrícula para o ano letivo em curso. Documentos e condições exigidos: ${resumo}. Prepare toda a documentação antes de realizar a solicitação de vaga.`,
      tipo: 'inscricao',
      instituicao_id: new ObjectId(instituicaoId),
      publicado: 1,
      destaque: 0,
      autor_id: new ObjectId(req.user.id),
      autor_nome: autor,
      created_at: new Date()
    };

    const comResult = await db.collection('comunicados').insertOne(comunicado);

    const now = new Date();
    await db.collection('configuracoes_inscricao').findOneAndUpdate(
      { instituicao_id: new ObjectId(instituicaoId) },
      {
        $set: {
          estado: 'aprovada',
          comunicado_id: comResult.insertedId,
          aprovado_por: new ObjectId(req.user.id),
          aprovado_em: now,
          updated_at: now
        }
      }
    );

    const aprovada = await getConfigDoc(db, instituicaoId);

    res.json({
      data: toId(aprovada),
      comunicado_id: String(comResult.insertedId),
      message: 'Configuração aprovada e comunicado publicado em todo o sistema'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar configuração' });
  }
};

function matchId(id) {
  if (ObjectId.isValid(id)) return new ObjectId(id);
  return id;
}

exports.uploadModelo = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });

    const url = req.file.path;
    const existing = await getConfigDoc(db, instituicaoId);
    const modo = existing?.formulario?.modo === 'online' && (existing.formulario.campos || []).length > 0
      ? 'online'
      : 'modelo';

    await db.collection('configuracoes_inscricao').updateOne(
      { instituicao_id: new ObjectId(instituicaoId) },
      {
        $set: {
          'formulario.modo': modo,
          'formulario.modelo_url': url,
          'formulario.modelo_nome': req.file.originalname,
          updated_at: new Date()
        },
        $setOnInsert: {
          created_at: new Date(),
          instituicao_id: new ObjectId(instituicaoId),
          estado: 'rascunho',
          ciclos: []
        }
      },
      { upsert: true }
    );

    const saved = await getConfigDoc(db, instituicaoId);
    res.json({
      data: toId(saved),
      message: 'Modelo da ficha carregado. Os encarregados farão o download e devolverão preenchido.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar modelo da ficha' });
  }
};

exports.removerModelo = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    await db.collection('configuracoes_inscricao').updateOne(
      { instituicao_id: new ObjectId(instituicaoId) },
      {
        $set: {
          'formulario.modelo_url': null,
          'formulario.modelo_nome': null,
          'formulario.modo': 'online',
          updated_at: new Date()
        }
      }
    );

    const saved = await getConfigDoc(db, instituicaoId);
    res.json({ data: toId(saved), message: 'Modelo removido. A ficha será preenchida no site.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover modelo da ficha' });
  }
};