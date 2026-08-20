const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

const ciclos = {
  primario: { nome: 'Ensino Primário', niveis: ['1a_classe', '2a_classe', '3a_classe', '4a_classe', '5a_classe', '6a_classe'] },
  secundario: { nome: 'I Ciclo do Ensino Secundário', niveis: ['7a_classe', '8a_classe', '9a_classe'] },
  medio: { nome: 'Ensino Médio (II Ciclo)', niveis: ['10a_classe', '11a_classe', '12a_classe'] }
};

const requisitosPadrao = {
  primario: [
    { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', descricao: 'Assinado digitalmente ou presencialmente pela escola', obrigatorio: true, aceita_pdf: true },
    { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', descricao: 'Informação declarada pelo encarregado', obrigatorio: true, aceita_pdf: false },
    { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', descricao: 'Emitida por uma unidade sanitária', obrigatorio: true, aceita_pdf: true },
    { chave: 'bi_encarregado', nome: 'BI do Encarregado', descricao: 'Documento de identificação do responsável', obrigatorio: true, aceita_pdf: true },
    { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', descricao: 'Fatura de água/luz ou declaração do bairro', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: '2 Fotos do Aluno tipo passe', descricao: 'Atualizadas', obrigatorio: true, aceita_pdf: false }
  ],
  secundario: [
    { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', descricao: 'Assinado digitalmente ou presencialmente pela escola', obrigatorio: true, aceita_pdf: true },
    { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', descricao: 'Informação declarada pelo encarregado', obrigatorio: true, aceita_pdf: false },
    { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', descricao: 'Emitida por uma unidade sanitária', obrigatorio: true, aceita_pdf: true },
    { chave: 'bi_encarregado', nome: 'BI do Encarregado', descricao: 'Documento de identificação do responsável', obrigatorio: true, aceita_pdf: true },
    { chave: 'certificado_6a', nome: 'Certificado da 6ª Classe (original)', descricao: 'Para conferência na secretaria', obrigatorio: true, aceita_pdf: true },
    { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', descricao: 'Fatura de água/luz ou declaração do bairro', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: '2 Fotos do Aluno tipo passe', descricao: 'Atualizadas', obrigatorio: true, aceita_pdf: false }
  ],
  medio: [
    { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', descricao: 'Assinado digitalmente ou presencialmente pela escola', obrigatorio: true, aceita_pdf: true },
    { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', descricao: 'Informação declarada pelo encarregado', obrigatorio: true, aceita_pdf: false },
    { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', descricao: 'Emitida por uma unidade sanitária', obrigatorio: true, aceita_pdf: true },
    { chave: 'bi_aluno', nome: 'BI do Aluno', descricao: 'Documento de identificação do aluno', obrigatorio: true, aceita_pdf: true },
    { chave: 'certificado_9a', nome: 'Certificado da 9ª Classe (original)', descricao: 'Para conferência na secretaria', obrigatorio: true, aceita_pdf: true },
    { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', descricao: 'Fatura de água/luz ou declaração do bairro', obrigatorio: true, aceita_pdf: true },
    { chave: 'fotos_aluno', nome: '2 Fotos do Aluno tipo passe', descricao: 'Atualizadas', obrigatorio: true, aceita_pdf: false }
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

async function getConfigDoc(db, instituicaoId) {
  return db.collection('configuracoes_matricula').findOne({ instituicao_id: new ObjectId(instituicaoId) });
}

function toId(doc) {
  if (!doc) return null;
  return { ...doc, id: String(doc._id) };
}

function matchId(id) {
  if (ObjectId.isValid(id)) return new ObjectId(id);
  return id;
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
        estado: 'padrao',
        origem: 'padrao'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar requisitos de matrícula' });
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
      return res.json({ data: { id: null, instituicao_id: String(instituicaoId), ciclos: ciclosResumo, estado: 'padrao' } });
    }
    res.json({ data: toId(config) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar requisitos de matrícula' });
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
        mensagem: 'Requisitos de matrícula gerados pelo assistente. Reveja, ajuste se necessário e guarde.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar requisitos de matrícula' });
  }
};

exports.salvar = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const { ciclos, estado } = req.body;
    if (!Array.isArray(ciclos) || ciclos.length === 0) {
      return res.status(400).json({ error: 'É necessário definir pelo menos um ciclo' });
    }

    const now = new Date();
    await db.collection('configuracoes_matricula').findOneAndUpdate(
      { instituicao_id: new ObjectId(instituicaoId) },
      {
        $set: {
          ciclos,
          estado: estado === 'aprovada' ? 'aprovada' : 'rascunho',
          atualizado_por: new ObjectId(req.user.id),
          updated_at: now
        },
        $setOnInsert: { created_at: now }
      },
      { upsert: true }
    );

    const saved = await getConfigDoc(db, instituicaoId);
    res.json({ data: toId(saved), message: 'Configuração de matrícula guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar configuração de matrícula' });
  }
};

exports.aprovar = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const config = await getConfigDoc(db, instituicaoId);
    if (!config || !Array.isArray(config.ciclos) || config.ciclos.length === 0) {
      return res.status(400).json({ error: 'Guarde a configuração de matrícula antes de aprovar' });
    }

    const instituicao = await db.collection('instituicoes').findOne({ _id: new ObjectId(instituicaoId) });
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const autor = usuario?.nome || usuario?.username || 'Instituição';

    const itens = config.ciclos.flatMap((c) =>
      (c.requisitos || []).map((r) => `${r.nome}${r.obrigatorio ? '' : ' (opcional)'}`)
    );
    const resumo = itens.slice(0, 8).join(', ') + (itens.length > 8 ? '...' : '');

    const comunicado = {
      titulo: `Requisitos de matrícula — ${instituicao?.nome || 'Instituição'}`,
      conteudo: `Após a aprovação da vaga, para efetivar a matrícula o encarregado deverá reunir e apresentar: ${resumo}.`,
      tipo: 'matricula',
      instituicao_id: new ObjectId(instituicaoId),
      publicado: 1,
      destaque: 0,
      autor_id: new ObjectId(req.user.id),
      autor_nome: autor,
      created_at: new Date()
    };

    const comResult = await db.collection('comunicados').insertOne(comunicado);

    const now = new Date();
    await db.collection('configuracoes_matricula').findOneAndUpdate(
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
      message: 'Requisitos de matrícula aprovados e comunicado publicado em todo o sistema'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar configuração de matrícula' });
  }
};

exports.requisitosParaNivel = async (nivel) => {
  const ciclo = cicloDeNivel(nivel);
  const db = getDB();
  const config = await db.collection('configuracoes_matricula').findOne({ estado: 'aprovada' });
  return config ? config.ciclos.find((c) => c.ciclo === ciclo)?.requisitos || [] : gerarRequisitos(ciclo);
};

module.exports = exports;