const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { matchId } = require('../utils/filters');
const { resolverEncarregado } = require('../utils/encarregadoUtil');

const getMatriculas = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, turma_id = '', ano_letivo = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (turma_id) {
      matchStage.turma_id = new ObjectId(turma_id);
    }
    if (ano_letivo) {
      matchStage.ano_letivo = ano_letivo;
    }

    const total = await db.collection('matriculas').countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { data_matricula: -1 } },
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
        $lookup: {
          from: 'turmas',
          localField: 'turma_id',
          foreignField: '_id',
          as: 'turma'
        }
      },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'instituicoes',
          let: { tid: '$turma.instituicao_id' },
          pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, { $toString: '$$tid' }] } } }],
          as: 'instituicao'
        }
      },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          _id: 1,
          aluno_id: 1,
          turma_id: 1,
          encarregado_id: 1,
          ano_letivo: 1,
          estado: 1,
          data_matricula: 1,
          created_at: 1,
          numero_processo: 1,
          status_processo: 1,
          aluno_nome: '$aluno.nome_completo',
          numero_estudante: '$aluno.numero_estudante',
          turma_nome: '$turma.nome',
          instituicao_nome: '$instituicao.nome'
        }
      }
    ];

    const matriculas = await db.collection('matriculas').aggregate(pipeline).toArray();

    res.json({
      data: matriculas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar matrículas' });
  }
};

const createMatricula = async (req, res) => {
  try {
    const db = getDB();
    const { aluno_id, turma_id, ano_letivo } = req.body;

    const existingMatricula = await db.collection('matriculas').findOne({
      aluno_id: new ObjectId(aluno_id),
      turma_id: new ObjectId(turma_id),
      ano_letivo,
      estado: 'ativa'
    });

    if (existingMatricula) {
      return res.status(400).json({ error: 'Aluno já matriculado nesta turma' });
    }

    const turma = await db.collection('turmas').findOne({ _id: new ObjectId(turma_id) });
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    if ((turma.vagas_ocupadas || 0) >= (turma.vagas || 0)) {
      return res.status(400).json({ error: 'Turma sem vagas disponíveis' });
    }

    const result = await db.collection('matriculas').insertOne({
      aluno_id: new ObjectId(aluno_id),
      turma_id: new ObjectId(turma_id),
      ano_letivo,
      estado: 'ativa',
      data_matricula: new Date(),
      created_at: new Date()
    });

    await db.collection('turmas').updateOne(
      { _id: new ObjectId(turma_id) },
      { $inc: { vagas_ocupadas: 1 } }
    );

    await db.collection('instituicoes').updateOne(
      { _id: matchId(turma.instituicao_id) },
      { $inc: { vagas_disponiveis: -1 } }
    );

    res.status(201).json({ message: 'Matrícula realizada com sucesso', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar matrícula' });
  }
};

const getMatriculasEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = await resolverEncarregado(usuario);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const matriculas = await db.collection('matriculas').aggregate([
      { $match: { encarregado_id: encarregadoId } },
      { $sort: { data_matricula: -1 } },
      { $lookup: { from: 'alunos', localField: 'aluno_id', foreignField: '_id', as: 'aluno' } },
      { $unwind: { path: '$aluno', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'instituicoes', localField: 'instituicao_id', foreignField: '_id', as: 'instituicao' } },
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'turmas', localField: 'turma_id', foreignField: '_id', as: 'turma' } },
      { $unwind: { path: '$turma', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'cursos', localField: 'curso_id', foreignField: '_id', as: 'curso' } },
      { $unwind: { path: '$curso', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        id: { $toString: '$_id' },
        aluno_nome: '$aluno.nome_completo',
        numero_estudante: '$aluno.numero_estudante',
        numero_processo: '$numero_processo',
        status_processo: '$status_processo',
        instituicao_nome: '$instituicao.nome',
        turma_nome: { $ifNull: ['$turma.nome', '$curso.nome'] }
      } },
      { $project: { aluno: 0, instituicao: 0, curso: 0, turma: 0 } }
    ]).toArray();

    res.json({ data: matriculas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar matrículas' });
  }
};

const createMatriculaEncarregado = async (req, res) => {
  try {
    const db = getDB();
    const { solicitacao_id, requisitos_confirmados } = req.body;
    const pagamentoController = require('./pagamentoController');
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
    const encarregadoId = await resolverEncarregado(usuario);
    if (!encarregadoId) return res.status(400).json({ error: 'Encarregado não encontrado' });

    const solicitacao = await db.collection('solicitacoes').findOne({
      _id: new ObjectId(solicitacao_id),
      encarregado_id: encarregadoId
    });
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });

    if (!['aceite', 'agendado'].includes(solicitacao.estado)) {
      return res.status(400).json({ error: 'A matrícula só pode ser feita após a solicitação ser aceite.' });
    }

    if (solicitacao.estado === 'inscrito') {
      return res.status(400).json({ error: 'Esta solicitação já foi inscrita.' });
    }

    const instituicaoId = solicitacao.instituicao_id;
    if (!instituicaoId) return res.status(400).json({ error: 'Solicitação sem instituição' });

    const turma = solicitacao.turma_id
      ? await db.collection('turmas').findOne({ _id: new ObjectId(solicitacao.turma_id) })
      : null;

    const configMatricula = await db.collection('configuracoes_matricula').findOne({ instituicao_id: new ObjectId(instituicaoId) });
    const nivel = turma?.nivel || '';
    const ciclo = nivel.includes('7a') || nivel.includes('8a') || nivel.includes('9a') ? 'secundario'
      : nivel.includes('10a') || nivel.includes('11a') || nivel.includes('12a') ? 'medio'
      : 'primario';
    const requisitosPadrao = {
      primario: [
        { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', obrigatorio: true },
        { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', obrigatorio: true },
        { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', obrigatorio: true },
        { chave: 'bi_encarregado', nome: 'BI do Encarregado', obrigatorio: true },
        { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', obrigatorio: true },
        { chave: 'fotos_aluno', nome: '2 Fotos do Aluno', obrigatorio: true }
      ],
      secundario: [
        { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', obrigatorio: true },
        { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', obrigatorio: true },
        { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', obrigatorio: true },
        { chave: 'bi_encarregado', nome: 'BI do Encarregado', obrigatorio: true },
        { chave: 'certificado_6a', nome: 'Certificado da 6ª Classe', obrigatorio: true },
        { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', obrigatorio: true },
        { chave: 'fotos_aluno', nome: '2 Fotos do Aluno', obrigatorio: true }
      ],
      medio: [
        { chave: 'termo_compromisso', nome: 'Termo de Compromisso assinado', obrigatorio: true },
        { chave: 'grupo_sanguineo', nome: 'Grupo Sanguíneo', obrigatorio: true },
        { chave: 'declaracao_saude', nome: 'Declaração de Saúde do Aluno', obrigatorio: true },
        { chave: 'bi_aluno', nome: 'BI do Aluno', obrigatorio: true },
        { chave: 'certificado_9a', nome: 'Certificado da 9ª Classe', obrigatorio: true },
        { chave: 'comprovativo_residencia', nome: 'Comprovativo de Residência', obrigatorio: true },
        { chave: 'fotos_aluno', nome: '2 Fotos do Aluno', obrigatorio: true }
      ]
    };
    const requisitosConfig = (configMatricula && configMatricula.estado === 'aprovada')
      ? (configMatricula.ciclos || []).find((c) => c.ciclo === ciclo)?.requisitos || []
      : requisitosPadrao[ciclo] || requisitosPadrao.primario;

    const confirmados = new Set(Array.isArray(requisitos_confirmados) ? requisitos_confirmados : []);
    const emFalta = (requisitosConfig || []).filter((r) => r.obrigatorio && !confirmados.has(r.chave));
    if (emFalta.length > 0) {
      return res.status(400).json({
        error: `Confirme os requisitos de matrícula obrigatórios antes de concluir: ${emFalta.map((r) => r.nome).join(', ')}`
      });
    }

    await pagamentoController.garantirTransacoesMatricula(solicitacao);
    const pendentes = await pagamentoController.verificarPagamentosMatricula(solicitacao);
    if (pendentes.length > 0) {
      const lista = pendentes.map((p) => `${p.descricao} (${p.valor.toLocaleString('pt-AO')} Kz)`).join(', ');
      return res.status(400).json({
        error: `Efetue o pagamento antes de concluir a matrícula: ${lista}. Aceda à secção de pagamentos do portal.`,
        pagamentos_pendentes: pendentes
      });
    }

    const numero_estudante = `A${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    const numero_processo = pagamentoController.gerarNumeroProcesso(db);

    let aluno = await db.collection('alunos').findOne({
      nome_completo: solicitacao.aluno_nome,
      encarregado_id: encarregadoId
    });

    if (!aluno) {
      const alunoResult = await db.collection('alunos').insertOne({
        nome_completo: solicitacao.aluno_nome,
        data_nascimento: solicitacao.aluno_data_nascimento || null,
        sexo: solicitacao.aluno_sexo || 'M',
        naturalidade: '',
        numero_estudante,
        bi: solicitacao.aluno_bi || null,
        necessidades_especiais: solicitacao.necessidades_especiais || '',
        encarregado_id: encarregadoId,
        instituicao_id: instituicaoId,
        estado: 'ativo',
        created_at: new Date(),
        updated_at: new Date()
      });
      aluno = { _id: alunoResult.insertedId, nome_completo: solicitacao.aluno_nome, numero_estudante };
    }

    const ano_letivo = new Date().getFullYear();
    const turma_id = solicitacao.turma_id ? new ObjectId(solicitacao.turma_id) : null;
    const curso_id = solicitacao.curso_id ? new ObjectId(solicitacao.curso_id) : turma_id;

    if (turma_id) {
      if (turma && (turma.vagas_ocupadas || 0) >= (turma.vagas || 0)) {
        return res.status(400).json({ error: 'A turma selecionada já não tem vagas disponíveis' });
      }
    }

    if (curso_id && !turma) {
      const curso = await db.collection('cursos').findOne({ _id: curso_id });
      if (curso && (curso.vagas_disponiveis || 0) <= 0) {
        return res.status(400).json({ error: 'A turma selecionada já não tem vagas disponíveis' });
      }
    }

    const instituicao = await db.collection('instituicoes').findOne({ _id: matchId(instituicaoId) });
    if (instituicao && (instituicao.vagas_totais || 0) > 0 && (instituicao.vagas_disponiveis || 0) <= 0) {
      return res.status(400).json({ error: 'Esta instituição já não tem vagas disponíveis' });
    }

    const matriculaResult = await db.collection('matriculas').insertOne({
      aluno_id: aluno._id,
      encarregado_id: encarregadoId,
      instituicao_id: instituicaoId,
      curso_id,
      turma_id,
      solicitacao_id: solicitacao._id,
      numero_processo,
      ano_letivo,
      estado: 'ativa',
      status_processo: 'matriculado',
      data_matricula: new Date(),
      created_at: new Date()
    });

    await db.collection('alunos').updateOne(
      { _id: aluno._id },
      { $set: { status_processo: 'matriculado', numero_processo, updated_at: new Date() } }
    );

    const financeira = await db.collection('configuracoes_financeiras').findOne({ instituicao_id: new ObjectId(instituicaoId) });
    if (financeira?.mensalidade?.ativo && financeira.mensalidade.valor > 0) {
      try {
        await pagamentoController.gerarMensalidadesInterno(matriculaResult.insertedId, financeira);
      } catch (e) { /* não bloqueia a matrícula */ }
    }

    if (turma) {
      await db.collection('turmas').updateOne(
        { _id: turma._id },
        { $inc: { vagas_ocupadas: 1 } }
      );
    } else if (curso_id) {
      await db.collection('cursos').updateOne(
        { _id: curso_id },
        { $inc: { vagas_disponiveis: -1 } }
      );
    }

    if (instituicao && (instituicao.vagas_totais || 0) > 0 && (instituicao.vagas_disponiveis || 0) > 0) {
      await db.collection('instituicoes').updateOne(
        { _id: matchId(instituicaoId), vagas_disponiveis: { $gt: 0 } },
        { $inc: { vagas_disponiveis: -1 } }
      );
    }

    const historico = [
      ...(solicitacao.historico || []),
      { estado: 'inscrito', data: new Date(), autor: usuario.nome || usuario.username, observacoes: 'Matrícula online efetuada pelo encarregado' }
    ];
    await db.collection('solicitacoes').updateOne(
      { _id: solicitacao._id },
      { $set: { estado: 'inscrito', historico, data_resposta: new Date() } }
    );

    const io = req.app.get('io');
    if (io) {
      const atualizada = await db.collection('solicitacoes').findOne({ _id: solicitacao._id });
      const payload = {
        ...atualizada,
        id: atualizada._id.toString(),
        encarregado_id: atualizada.encarregado_id ? atualizada.encarregado_id.toString() : null,
        instituicao_id: atualizada.instituicao_id ? atualizada.instituicao_id.toString() : null
      };
      io.emit('solicitacao:update', payload);
      io.emit('matricula:novo', { id: matriculaResult.insertedId.toString(), aluno_nome: aluno.nome_completo, instituicao_id: instituicaoId.toString() });
      io.to('entidade:' + encarregadoId.toString()).emit('solicitacao:update', payload);
    }

    res.status(201).json({
      message: 'Matrícula realizada com sucesso',
      matricula_id: matriculaResult.insertedId.toString(),
      numero_estudante: aluno.numero_estudante,
      numero_processo
    });
  } catch (error) {
    console.error('Erro ao criar matrícula do encarregado:', error);
    res.status(500).json({ error: 'Erro ao criar matrícula' });
  }
};

const cancelMatricula = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const matricula = await db.collection('matriculas').findOne({ _id: new ObjectId(id) });
    if (!matricula) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    await db.collection('matriculas').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'cancelada' } }
    );

    await db.collection('turmas').updateOne(
      { _id: matricula.turma_id },
      { $inc: { vagas_ocupadas: -1 } }
    );

    const turma = await db.collection('turmas').findOne({ _id: matricula.turma_id });
    if (turma) {
      await db.collection('instituicoes').updateOne(
        { _id: matchId(turma.instituicao_id) },
        { $inc: { vagas_disponiveis: 1 } }
      );
    }

    res.json({ message: 'Matrícula cancelada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar matrícula' });
  }
};

module.exports = {
  getMatriculas,
  createMatricula,
  cancelMatricula,
  getMatriculasEncarregado,
  createMatriculaEncarregado
};
