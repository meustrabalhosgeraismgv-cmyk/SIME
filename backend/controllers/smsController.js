const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { SMS_CONFIG } = require('../config/sms');

async function enviarSMS({ telefone, mensagem, destinatario_id = null, destinatario_tipo = null, tipo = 'pontual', criado_por = null }) {
  const db = getDB();

  let estado = 'simulado';
  let gateway = null;

  if (SMS_CONFIG.enabled && telefone) {
    try {
      const url = SMS_CONFIG.apiUrl.replace('{telefone}', encodeURIComponent(telefone)).replace('{mensagem}', encodeURIComponent(mensagem));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Api-Key': SMS_CONFIG.apiKey || '' },
        signal: controller.signal
      });
      clearTimeout(timer);

      gateway = SMS_CONFIG.provider;
      estado = response.ok ? 'enviado' : 'falhou';
    } catch (error) {
      console.error('Erro no gateway SMS:', error.message);
      gateway = SMS_CONFIG.provider;
      estado = 'erro';
    }
  }

  const result = await db.collection('sms_mensagens').insertOne({
    telefone,
    mensagem,
    destinatario_id: destinatario_id ? new ObjectId(destinatario_id) : null,
    destinatario_tipo,
    tipo,
    estado,
    gateway,
    criado_por: criado_por ? new ObjectId(criado_por) : null,
    created_at: new Date()
  });

  return { id: result.insertedId.toString(), estado, gateway };
}

const getSms = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, estado = '', tipo = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (estado) matchStage.estado = estado;
    if (tipo) matchStage.tipo = tipo;

    const total = await db.collection('sms_mensagens').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'encarregados',
          localField: 'destinatario_id',
          foreignField: '_id',
          as: 'destinatario'
        }
      },
      { $unwind: { path: '$destinatario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          telefone: 1,
          mensagem: 1,
          tipo: 1,
          estado: 1,
          gateway: 1,
          created_at: 1,
          destinatario_nome: '$destinatario.nome_completo'
        }
      }
    ];

    const data = await db.collection('sms_mensagens').aggregate(pipeline).toArray();

    res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar SMS:', error);
    res.status(500).json({ error: 'Erro ao listar SMS' });
  }
};

const getSmsStats = async (req, res) => {
  try {
    const db = getDB();
    const [total, enviados, simulados, comErro, contactos] = await Promise.all([
      db.collection('sms_mensagens').countDocuments(),
      db.collection('sms_mensagens').countDocuments({ estado: 'enviado' }),
      db.collection('sms_mensagens').countDocuments({ estado: 'simulado' }),
      db.collection('sms_mensagens').countDocuments({ estado: { $in: ['erro', 'falhou'] } }),
      db.collection('encarregados').countDocuments({ telefone: { $exists: true, $ne: '' } })
    ]);

    res.json({ total, enviados, simulados, comErro, contactos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas SMS' });
  }
};

const getDestinatarios = async (req, res) => {
  try {
    const db = getDB();
    const encarregados = await db.collection('encarregados')
      .find({ telefone: { $exists: true, $ne: '' } })
      .project({ nome_completo: 1, telefone: 1 })
      .sort({ nome_completo: 1 })
      .limit(500)
      .toArray();

    res.json({ data: encarregados });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar destinatários' });
  }
};

const sendSms = async (req, res) => {
  try {
    const { telefone, mensagem, destinatario_id, destinatario_tipo } = req.body;

    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    const result = await enviarSMS({
      telefone,
      mensagem,
      destinatario_id,
      destinatario_tipo,
      tipo: 'pontual',
      criado_por: req.user.id
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    res.status(500).json({ error: 'Erro ao enviar SMS' });
  }
};

const sendSmsEmMassa = async (req, res) => {
  try {
    const { mensagem, telefones = [] } = req.body;

    if (!mensagem || !Array.isArray(telefones) || telefones.length === 0) {
      return res.status(400).json({ error: 'Mensagem e lista de telefones são obrigatórias' });
    }

    const resultados = [];
    for (const telefone of telefones) {
      if (!telefone) continue;
      const r = await enviarSMS({
        telefone,
        mensagem,
        tipo: 'massa',
        criado_por: req.user.id
      });
      resultados.push(r);
    }

    res.status(201).json({ total: resultados.length, resultados });
  } catch (error) {
    console.error('Erro ao enviar SMS em massa:', error);
    res.status(500).json({ error: 'Erro ao enviar SMS em massa' });
  }
};

module.exports = {
  getSms,
  getSmsStats,
  getDestinatarios,
  sendSms,
  sendSmsEmMassa,
  enviarSMS
};
