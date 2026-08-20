const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

function financeiroPadrao() {
  return {
    emolumento_inscricao: { valor: 0, ativo: false },
    emolumento_matricula: { valor: 0, ativo: false },
    primeira_mensalidade: false,
    mensalidade: { valor: 0, ativo: false, dia_limite: 10, multa_atraso: 0 },
    comparticipacao: { valor: 0, ativo: false, descricao: '' }
  };
}

function sanitizarFinanceiro(body) {
  const padrao = financeiroPadrao();
  const monet = (v) => Math.max(0, parseFloat(v) || 0);
  const num = (v, d) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? d : n;
  };

  return {
    emolumento_inscricao: {
      valor: monet(body?.emolumento_inscricao?.valor),
      ativo: !!body?.emolumento_inscricao?.ativo
    },
    emolumento_matricula: {
      valor: monet(body?.emolumento_matricula?.valor),
      ativo: !!body?.emolumento_matricula?.ativo
    },
    primeira_mensalidade: !!body?.primeira_mensalidade,
    mensalidade: {
      valor: monet(body?.mensalidade?.valor),
      ativo: !!body?.mensalidade?.ativo,
      dia_limite: num(body?.mensalidade?.dia_limite, padrao.mensalidade.dia_limite),
      multa_atraso: monet(body?.mensalidade?.multa_atraso)
    },
    comparticipacao: {
      valor: monet(body?.comparticipacao?.valor),
      ativo: !!body?.comparticipacao?.ativo,
      descricao: String(body?.comparticipacao?.descricao || '').slice(0, 200)
    }
  };
}

async function getDoc(db, instituicaoId) {
  return db.collection('configuracoes_financeiras').findOne({ instituicao_id: new ObjectId(instituicaoId) });
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

    const doc = await getDoc(db, instituicaoId);
    const padrao = financeiroPadrao();
    const data = doc ? {
      id: String(doc._id),
      instituicao_id: String(doc.instituicao_id),
      emolumento_inscricao: doc.emolumento_inscricao || padrao.emolumento_inscricao,
      emolumento_matricula: doc.emolumento_matricula || padrao.emolumento_matricula,
      primeira_mensalidade: !!doc.primeira_mensalidade,
      mensalidade: doc.mensalidade || padrao.mensalidade,
      comparticipacao: doc.comparticipacao || padrao.comparticipacao
    } : { ...padrao, instituicao_id: String(instituicaoId), id: null };

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar configurações financeiras' });
  }
};

exports.getMinha = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const doc = await getDoc(db, instituicaoId);
    const padrao = financeiroPadrao();
    const data = doc ? toId(doc) : { ...padrao, instituicao_id: String(instituicaoId), id: null };
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar configurações financeiras' });
  }
};

exports.salvar = async (req, res) => {
  try {
    const db = getDB();
    const { instituicaoId } = req.params;
    if (!ObjectId.isValid(instituicaoId)) return res.status(400).json({ error: 'Instituição inválida' });

    const financeiro = sanitizarFinanceiro(req.body);
    const now = new Date();

    await db.collection('configuracoes_financeiras').findOneAndUpdate(
      { instituicao_id: new ObjectId(instituicaoId) },
      {
        $set: {
          ...financeiro,
          atualizado_por: new ObjectId(req.user.id),
          updated_at: now
        },
        $setOnInsert: { created_at: now }
      },
      { upsert: true }
    );

    const saved = await getDoc(db, instituicaoId);
    res.json({ data: toId(saved), message: 'Configuração financeira guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar configuração financeira' });
  }
};

exports.getDocumento = async (instituicaoId) => {
  const db = getDB();
  const doc = await db.collection('configuracoes_financeiras').findOne({ instituicao_id: new ObjectId(instituicaoId) });
  return doc || { ...financeiroPadrao(), instituicao_id: new ObjectId(instituicaoId) };
};

module.exports = exports;