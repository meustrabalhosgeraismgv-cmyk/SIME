const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const CHAVE = 'pagamento';

function padrao() {
  return {
    chave: CHAVE,
    pagamento_plataforma_ativado: false,
    gateway: 'EMIS',
    notas: 'Pagamentos pela plataforma desativados. Os encarregados carregam o comprovativo do pagamento.'
  };
}

async function getDoc(db) {
  return db.collection('configuracoes_globais').findOne({ chave: CHAVE });
}

exports.get = async (req, res) => {
  try {
    const db = getDB();
    const doc = await getDoc(db);
    const base = doc || padrao();

    const data = req.user && req.user.perfil === 'admin'
      ? { ...base, id: doc ? String(doc._id) : null }
      : {
          pagamento_plataforma_ativado: !!base.pagamento_plataforma_ativado,
          gateway: base.gateway,
          notas: base.notas
        };

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar configurações globais' });
  }
};

exports.salvar = async (req, res) => {
  try {
    if (!req.user || req.user.perfil !== 'admin') {
      return res.status(403).json({ error: 'Apenas o Administrador do Sistema pode alterar esta configuração' });
    }

    const db = getDB();
    const { pagamento_plataforma_ativado, gateway, notas } = req.body;

    await db.collection('configuracoes_globais').findOneAndUpdate(
      { chave: CHAVE },
      {
        $set: {
          pagamento_plataforma_ativado: !!pagamento_plataforma_ativado,
          gateway: String(gateway || 'EMIS').slice(0, 50),
          notas: String(notas || '').slice(0, 500),
          updated_by: new ObjectId(req.user.id),
          updated_at: new Date()
        },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );

    const saved = await getDoc(db);
    res.json({ data: { ...saved, id: String(saved._id) }, message: 'Configuração global guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar configuração global' });
  }
};

exports.estadoPagamentoPlataforma = async () => {
  const db = getDB();
  const doc = await getDoc(db);
  return !!doc?.pagamento_plataforma_ativado;
};

module.exports = exports;