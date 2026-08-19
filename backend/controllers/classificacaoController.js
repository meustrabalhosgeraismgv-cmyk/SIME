const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { oid } = require('../utils/filters');
const { enviarSMS } = require('./smsController');

const CLASSES = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12a', '13a'];

const getClassificacoes = async (req, res) => {
  try {
    const db = getDB();
    const { aluno_id = '', page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (aluno_id) matchStage.aluno_id = new ObjectId(aluno_id);

    const total = await db.collection('classificacoes').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { classe_numero: -1, ano_letivo: -1, created_at: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'alunos',
          localField: 'aluno_id',
          foreignField: '_id',
          as: 'aluno'
        }
      },
      { $unwind: { path: '$aluno', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          aluno_id: 1,
          classe: 1,
          ano_letivo: 1,
          periodo: 1,
          disciplinas: 1,
          media_geral: 1,
          estado: 1,
          observacoes: 1,
          created_at: 1,
          aluno_nome: '$aluno.nome_completo'
        }
      }
    ];

    const data = await db.collection('classificacoes').aggregate(pipeline).toArray();

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
    console.error('Erro ao listar classificações:', error);
    res.status(500).json({ error: 'Erro ao listar classificações' });
  }
};

const getHistoricoAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const historico = await db.collection('classificacoes')
      .find({ aluno_id: new ObjectId(id) })
      .sort({ classe_numero: -1, ano_letivo: -1 })
      .toArray();

    const porClasse = {};
    for (const c of historico) {
      const num = c.classe_numero || parseInt(c.classe) || 0;
      if (!porClasse[num]) porClasse[num] = [];
      porClasse[num].push(c);
    }

    res.json({
      aluno_id: id,
      historico,
      por_classe: porClasse,
      classes_anteriores: Object.keys(porClasse).map(Number).sort((a, b) => b - a)
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

const createClassificacao = async (req, res) => {
  try {
    const db = getDB();
    const { aluno_id, classe, ano_letivo, periodo, disciplinas, media_geral, estado, observacoes } = req.body;

    if (!aluno_id || !classe) {
      return res.status(400).json({ error: 'Aluno e classe são obrigatórios' });
    }

    const classeNumero = parseInt(classe.replace(/\D/g, '')) || 0;

    let media = media_geral;
    if (media === undefined && Array.isArray(disciplinas)) {
      const notas = disciplinas
        .map(d => parseFloat(d.nota_final ?? d.nota))
        .filter(n => !isNaN(n));
      media = notas.length
        ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100
        : 0;
    }

    const estadoFinal = estado || (media >= 10 ? 'aprovado' : 'reprovado');

    const result = await db.collection('classificacoes').insertOne({
      aluno_id: new ObjectId(aluno_id),
      classe,
      classe_numero: classeNumero,
      ano_letivo: ano_letivo || new Date().getFullYear(),
      periodo: periodo || 'anual',
      disciplinas: disciplinas || [],
      media_geral: media || 0,
      estado: estadoFinal,
      observacoes: observacoes || '',
      created_at: new Date()
    });

    try {
      const aluno = await db.collection('alunos').findOne({ _id: oid(aluno_id) });
      if (aluno?.encarregado_id) {
        const encarregado = await db.collection('encarregados').findOne({ _id: oid(aluno.encarregado_id) });
        if (encarregado?.telefone) {
          const situacao = estadoFinal === 'aprovado' ? 'APROVADO' : estadoFinal === 'reprovado' ? 'REPROVADO' : estadoFinal;
          await enviarSMS({
            telefone: encarregado.telefone,
            mensagem: `[SIME] Boletim do educando ${aluno.nome_completo} — ${classe} • ${periodo || 'anual'}${ano_letivo ? ' ' + ano_letivo : ''}: média ${media || 0}. Situação: ${situacao}. Consulte o portal SIME.`,
            destinatario_id: aluno.encarregado_id,
            destinatario_tipo: 'encarregado',
            tipo: 'sistema',
            criado_por: req.user.id
          });
        }
      }
    } catch (err) {
      console.error('Erro ao notificar encarregado do boletim:', err.message);
    }

    res.status(201).json({ id: result.insertedId.toString(), message: 'Classificação registada e comunicada ao encarregado' });
  } catch (error) {
    console.error('Erro ao criar classificação:', error);
    res.status(500).json({ error: 'Erro ao criar classificação' });
  }
};

const updateClassificacao = async (req, res) => {
  try {
    const db = getDB();
    const { classe, ano_letivo, periodo, disciplinas, media_geral, estado, observacoes } = req.body;

    const updateData = {};
    if (classe !== undefined) {
      updateData.classe = classe;
      updateData.classe_numero = parseInt(classe.replace(/\D/g, '')) || 0;
    }
    if (ano_letivo !== undefined) updateData.ano_letivo = ano_letivo;
    if (periodo !== undefined) updateData.periodo = periodo;
    if (disciplinas !== undefined) updateData.disciplinas = disciplinas;
    if (media_geral !== undefined) updateData.media_geral = media_geral;
    if (estado !== undefined) updateData.estado = estado;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    await db.collection('classificacoes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Classificação atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar classificação' });
  }
};

const deleteClassificacao = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('classificacoes').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Classificação removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover classificação' });
  }
};

module.exports = {
  getClassificacoes,
  getHistoricoAluno,
  createClassificacao,
  updateClassificacao,
  deleteClassificacao
};
