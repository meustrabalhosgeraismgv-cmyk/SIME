const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { matchInstituicaoId, lookupInstituicao, oid } = require('../utils/filters');
const { enviarSMS } = require('./smsController');

const ESTADOS_ALUNO = ['ativo', 'suspenso', 'expulso', 'transferido', 'abandono', 'concluido'];

const podeGerirAluno = (aluno, req) => {
  if (req.user?.perfil === 'admin') return true;
  if (req.user?.perfil === 'instituicao') {
    if (!req.user.entidade_id || !aluno?.instituicao_id) return false;
    return String(aluno.instituicao_id) === String(req.user.entidade_id);
  }
  return false;
};

const notificarEncarregado = async (db, aluno, mensagem, req) => {
  try {
    if (!aluno?.encarregado_id) return { notificado: false, motivo: 'sem_encarregado' };
    const encarregado = await db.collection('encarregados').findOne({ _id: oid(aluno.encarregado_id) });
    if (!encarregado?.telefone) return { notificado: false, motivo: 'sem_telefone' };
    const sms = await enviarSMS({
      telefone: encarregado.telefone,
      mensagem,
      destinatario_id: aluno.encarregado_id,
      destinatario_tipo: 'encarregado',
      tipo: 'sistema',
      criado_por: req.user.id
    });
    return { notificado: true, sms };
  } catch (error) {
    console.error('Erro ao notificar encarregado:', error.message);
    return { notificado: false, motivo: 'erro' };
  }
};

const getAlunos = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, search = '', instituicao_id = '', estado = '', encarregado_id = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { nome_completo: { $regex: search, $options: 'i' } },
        { numero_estudante: { $regex: search, $options: 'i' } }
      ];
    }
    if (req.user?.perfil === 'instituicao') {
      matchStage.instituicao_id = matchInstituicaoId(req.user.entidade_id);
    } else if (instituicao_id) {
      matchStage.instituicao_id = matchInstituicaoId(instituicao_id);
    }
    if (encarregado_id) {
      matchStage.encarregado_id = matchInstituicaoId(encarregado_id);
    }
    if (estado) {
      matchStage.estado = estado;
    }

    const total = await db.collection('alunos').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { nome_completo: 1 } },
      { $skip: skip },
      { $limit: limitNum },
      lookupInstituicao('instituicao_id', 'instituicao'),
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'encarregados',
          localField: 'encarregado_id',
          foreignField: '_id',
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          _id: 1,
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          naturalidade: 1,
          numero_estudante: 1,
          encarregado_id: 1,
          instituicao_id: 1,
          estado: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          encarregado_nome: '$encarregado.nome_completo'
        }
      }
    ];

    const alunos = await db.collection('alunos').aggregate(pipeline).toArray();

    res.json({
      data: alunos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

const getAlunoById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      lookupInstituicao('instituicao_id', 'instituicao'),
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'encarregados',
          localField: 'encarregado_id',
          foreignField: '_id',
          as: 'encarregado'
        }
      },
      { $unwind: { path: '$encarregado', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          _id: 1,
          nome_completo: 1,
          data_nascimento: 1,
          sexo: 1,
          naturalidade: 1,
          numero_estudante: 1,
          encarregado_id: 1,
          instituicao_id: 1,
          estado: 1,
          telefone: 1,
          email: 1,
          morada: 1,
          bi: 1,
          grupo_sanguineo: 1,
          religiao: 1,
          contacto_emergencia_nome: 1,
          contacto_emergencia_telefone: 1,
          controlo_parental: 1,
          foto_url: 1,
          historico_disciplinar: 1,
          advertencias: 1,
          processos_disciplinares: 1,
          created_at: 1,
          instituicao_nome: '$instituicao.nome',
          encarregado_nome: '$encarregado.nome_completo',
          encarregado_telefone: '$encarregado.telefone'
        }
      }
    ];

    const result = await db.collection('alunos').aggregate(pipeline).toArray();
    if (result.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    if (!podeGerirAluno(result[0], req)) {
      if (req.user?.perfil === 'encarregado') {
        const encId = String(result[0].encarregado_id || '');
        if (encId !== String(req.user.entidade_id || '')) {
          return res.status(403).json({ error: 'Sem permissão para consultar este aluno' });
        }
      } else {
        return res.status(403).json({ error: 'Sem permissão para consultar este aluno' });
      }
    }

    const aluno = result[0];

    const matriculas = await db.collection('matriculas').aggregate([
      { $match: { aluno_id: new ObjectId(id) } },
      { $sort: { ano_letivo: -1 } },
      {
        $lookup: {
          from: 'turmas',
          localField: 'turma_id',
          foreignField: '_id',
          as: 'turma'
        }
      },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          aluno_id: 1,
          turma_id: 1,
          ano_letivo: 1,
          estado: 1,
          data_matricula: 1,
          created_at: 1,
          turma_nome: '$turma.nome',
          ano_letivo: '$turma.ano_letivo',
          nivel: '$turma.nivel'
        }
      }
    ]).toArray();

    const classificacoes = await db.collection('classificacoes')
      .find({ aluno_id: new ObjectId(id) })
      .sort({ classe_numero: -1, ano_letivo: -1 })
      .toArray();

    res.json({ ...aluno, matriculas, classificacoes });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

const createAluno = async (req, res) => {
  try {
    const db = getDB();
    const {
      nome_completo, data_nascimento, sexo, naturalidade, numero_estudante,
      encarregado_id, instituicao_id,
      telefone, email, morada, bi, grupo_sanguineo, religiao,
      contacto_emergencia_nome, contacto_emergencia_telefone,
      controlo_parental, foto_url
    } = req.body;

    const existing = await db.collection('alunos').findOne({ numero_estudante });
    if (existing) {
      return res.status(400).json({ error: 'Número de estudante já existe' });
    }

    if (req.user?.perfil === 'instituicao' && String(instituicao_id) !== String(req.user.entidade_id)) {
      return res.status(403).json({ error: 'Só pode registar alunos na sua instituição' });
    }

    const result = await db.collection('alunos').insertOne({
      nome_completo,
      data_nascimento,
      sexo,
      naturalidade,
      numero_estudante,
      encarregado_id: encarregado_id ? new ObjectId(encarregado_id) : null,
      instituicao_id: new ObjectId(instituicao_id),
      telefone: telefone || '',
      email: email || '',
      morada: morada || '',
      bi: bi || '',
      grupo_sanguineo: grupo_sanguineo || '',
      religiao: religiao || '',
      contacto_emergencia_nome: contacto_emergencia_nome || '',
      contacto_emergencia_telefone: contacto_emergencia_telefone || '',
      controlo_parental: controlo_parental || {
        activo: false,
        permissoes: {},
        contactos_autorizados: []
      },
      foto_url: foto_url || null,
      estado: 'ativo',
      created_at: new Date()
    });

    await db.collection('instituicoes').updateOne(
      { _id: new ObjectId(instituicao_id) },
      { $inc: { total_alunos: 1 } }
    );

    res.status(201).json({ message: 'Aluno registado com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar aluno' });
  }
};

const updateAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      nome_completo, data_nascimento, sexo, naturalidade, numero_estudante,
      encarregado_id, instituicao_id, estado,
      telefone, email, morada, bi, grupo_sanguineo, religiao,
      contacto_emergencia_nome, contacto_emergencia_telefone,
      controlo_parental, foto_url
    } = req.body;

    const aluno = await db.collection('alunos').findOne({ _id: new ObjectId(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para editar este aluno' });

    const updateData = {
      nome_completo,
      data_nascimento,
      sexo,
      naturalidade,
      numero_estudante,
      encarregado_id: encarregado_id ? new ObjectId(encarregado_id) : null,
      instituicao_id: new ObjectId(instituicao_id),
      estado
    };

    if (telefone !== undefined) updateData.telefone = telefone;
    if (email !== undefined) updateData.email = email;
    if (morada !== undefined) updateData.morada = morada;
    if (bi !== undefined) updateData.bi = bi;
    if (grupo_sanguineo !== undefined) updateData.grupo_sanguineo = grupo_sanguineo;
    if (religiao !== undefined) updateData.religiao = religiao;
    if (contacto_emergencia_nome !== undefined) updateData.contacto_emergencia_nome = contacto_emergencia_nome;
    if (contacto_emergencia_telefone !== undefined) updateData.contacto_emergencia_telefone = contacto_emergencia_telefone;
    if (controlo_parental !== undefined) updateData.controlo_parental = controlo_parental;
    if (foto_url !== undefined) updateData.foto_url = foto_url;

    await db.collection('alunos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Aluno atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

const deleteAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const aluno = await db.collection('alunos').findOne({ _id: new ObjectId(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para remover este aluno' });

    await db.collection('alunos').deleteOne({ _id: new ObjectId(id) });

    if (aluno && aluno.instituicao_id) {
      await db.collection('instituicoes').updateOne(
        { _id: aluno.instituicao_id },
        { $inc: { total_alunos: -1 } }
      );
    }

    res.json({ message: 'Aluno removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover aluno' });
  }
};

const getFilhosEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const encarregadoId = req.user?.entidade_id;
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const alunos = await db.collection('alunos')
      .find({ encarregado_id: matchInstituicaoId(encarregadoId) })
      .sort({ nome_completo: 1 })
      .toArray();

    const comBoletim = await Promise.all(alunos.map(async (aluno) => {
      const classificacoes = await db.collection('classificacoes')
        .find({ aluno_id: aluno._id })
        .sort({ classe_numero: -1, ano_letivo: -1, created_at: -1 })
        .toArray();
      return { ...aluno, id: aluno._id.toString(), classificacoes };
    }));

    res.json({ data: comBoletim });
  } catch (error) {
    console.error('Erro ao buscar educandos:', error);
    res.status(500).json({ error: 'Erro ao buscar educandos' });
  }
};

const mudarEstadoAluno = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { acao, motivo = '' } = req.body;

    const acoes = {
      admitir: { estado: 'ativo', label: 'Admissão' },
      suspender: { estado: 'suspenso', label: 'Suspensão' },
      reativar: { estado: 'ativo', label: 'Reativação' },
      expulsar: { estado: 'expulso', label: 'Expulsão' }
    };
    const config = acoes[acao];
    if (!config) return res.status(400).json({ error: 'Ação inválida' });

    const aluno = await db.collection('alunos').findOne({ _id: oid(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para gerir este aluno' });

    const registo = {
      tipo: acao,
      descricao: config.label,
      motivo: motivo || '',
      estado_anterior: aluno.estado,
      estado_novo: config.estado,
      data: new Date(),
      autor: req.user.nome || req.user.username || req.user.id
    };

    await db.collection('alunos').updateOne(
      { _id: oid(id) },
      { $set: { estado: config.estado, updated_at: new Date() }, $push: { historico_disciplinar: registo } }
    );

    const notificacao = await notificarEncarregado(
      db, aluno,
      `[SIME] ${config.label} do estudante ${aluno.nome_completo} (${aluno.numero_estudante || 'sem nº'}).${motivo ? ' Motivo: ' + motivo : ''}`,
      req
    );

    res.json({ message: `${config.label} registada com sucesso`, estado: config.estado, notificacao });
  } catch (error) {
    console.error('Erro ao atualizar estado do aluno:', error);
    res.status(500).json({ error: 'Erro ao atualizar estado do aluno' });
  }
};

const emitirAdvertencia = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { motivo = '', tipo = 'verbal' } = req.body;
    if (!motivo) return res.status(400).json({ error: 'O motivo da advertência é obrigatório' });

    const aluno = await db.collection('alunos').findOne({ _id: oid(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para gerir este aluno' });

    const advertencia = {
      _id: new ObjectId(),
      tipo,
      motivo,
      data: new Date(),
      autor: req.user.nome || req.user.username || req.user.id,
      estado: 'ativa'
    };

    await db.collection('alunos').updateOne(
      { _id: oid(id) },
      {
        $push: {
          advertencias: advertencia,
          historico_disciplinar: {
            tipo: 'advertencia', descricao: `Advertência (${tipo})`, motivo,
            data: new Date(), autor: advertencia.autor
          }
        }
      }
    );

    const notificacao = await notificarEncarregado(
      db, aluno,
      `[SIME] Advertência ao estudante ${aluno.nome_completo} (${aluno.numero_estudante || 'sem nº'}). Motivo: ${motivo}`,
      req
    );

    res.status(201).json({ message: 'Advertência registada e comunicada ao encarregado', notificacao });
  } catch (error) {
    console.error('Erro ao registar advertência:', error);
    res.status(500).json({ error: 'Erro ao registar advertência' });
  }
};

const abrirProcessoDisciplinar = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { motivo = '', medidas = '' } = req.body;
    if (!motivo) return res.status(400).json({ error: 'O motivo do processo é obrigatório' });

    const aluno = await db.collection('alunos').findOne({ _id: oid(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para gerir este aluno' });

    const processo = {
      _id: new ObjectId(),
      numero: `PD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      motivo,
      medidas,
      estado: 'aberto',
      data_abertura: new Date(),
      autor: req.user.nome || req.user.username || req.user.id
    };

    await db.collection('alunos').updateOne(
      { _id: oid(id) },
      {
        $push: {
          processos_disciplinares: processo,
          historico_disciplinar: {
            tipo: 'processo_disciplinar', descricao: 'Abertura de processo disciplinar', motivo,
            data: new Date(), autor: processo.autor
          }
        }
      }
    );

    const notificacao = await notificarEncarregado(
      db, aluno,
      `[SIME] Processo disciplinar nº ${processo.numero} aberto ao estudante ${aluno.nome_completo}. Motivo: ${motivo}`,
      req
    );

    res.status(201).json({ message: 'Processo disciplinar aberto', numero: processo.numero, notificacao });
  } catch (error) {
    console.error('Erro ao abrir processo disciplinar:', error);
    res.status(500).json({ error: 'Erro ao abrir processo disciplinar' });
  }
};

const encerrarProcessoDisciplinar = async (req, res) => {
  try {
    const db = getDB();
    const { id, procId } = req.params;
    const { decisao = '' } = req.body;

    const aluno = await db.collection('alunos').findOne({ _id: oid(id) });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!podeGerirAluno(aluno, req)) return res.status(403).json({ error: 'Sem permissão para gerir este aluno' });

    const proc = (aluno.processos_disciplinares || []).find(p => String(p._id) === procId);
    if (!proc) return res.status(404).json({ error: 'Processo disciplinar não encontrado' });

    await db.collection('alunos').updateOne(
      { _id: oid(id), 'processos_disciplinares._id': oid(procId) },
      {
        $set: {
          'processos_disciplinares.$.estado': 'encerrado',
          'processos_disciplinares.$.decisao': decisao,
          'processos_disciplinares.$.data_encerramento': new Date()
        }
      }
    );

    const notificacao = await notificarEncarregado(
      db, aluno,
      `[SIME] Processo disciplinar nº ${proc.numero} do estudante ${aluno.nome_completo} encerrado.${decisao ? ' Decisão: ' + decisao : ''}`,
      req
    );

    res.json({ message: 'Processo disciplinar encerrado', notificacao });
  } catch (error) {
    console.error('Erro ao encerrar processo disciplinar:', error);
    res.status(500).json({ error: 'Erro ao encerrar processo disciplinar' });
  }
};

module.exports = {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno,
  getFilhosEncarregado,
  mudarEstadoAluno,
  emitirAdvertencia,
  abrirProcessoDisciplinar,
  encerrarProcessoDisciplinar
};
