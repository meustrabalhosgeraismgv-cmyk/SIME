const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { lookupInstituicao } = require('../utils/filters');

const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();

    const [totalInstituicoes, totalAlunos, totalProfessores, totalTurmas, totalMatriculas] = await Promise.all([
      db.collection('instituicoes').countDocuments(),
      db.collection('alunos').countDocuments(),
      db.collection('professores').countDocuments(),
      db.collection('turmas').countDocuments(),
      db.collection('matriculas').countDocuments({ estado: 'ativa' })
    ]);

    const instituicoesPorTipo = await db.collection('instituicoes').aggregate([
      { $group: { _id: '$tipo', total: { $sum: 1 } } }
    ]).toArray();

    const alunosPorGenero = await db.collection('alunos').aggregate([
      { $group: { _id: '$sexo', total: { $sum: 1 } } }
    ]).toArray();

    const vagasGerais = await db.collection('instituicoes').aggregate([
      {
        $group: {
          _id: null,
          total_vagas: { $sum: '$vagas_totais' },
          vagas_disponiveis: { $sum: '$vagas_disponiveis' }
        }
      }
    ]).toArray();

    const vagas = vagasGerais[0] || { total_vagas: 0, vagas_disponiveis: 0 };
    vagas.vagas_ocupadas = (vagas.total_vagas || 0) - (vagas.vagas_disponiveis || 0);

    const ultimasMatriculas = await db.collection('matriculas').aggregate([
      { $sort: { created_at: -1 } },
      { $limit: 5 },
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
      lookupInstituicao('turma.instituicao_id', 'instituicao'),
      { $unwind: { path: '$instituicao', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          aluno_id: 1,
          turma_id: 1,
          estado: 1,
          data_matricula: 1,
          created_at: 1,
          aluno_nome: '$aluno.nome_completo',
          turma_nome: '$turma.nome',
          instituicao_nome: '$instituicao.nome'
        }
      }
    ]).toArray();

    const alertasRecentes = await db.collection('alertas')
      .find()
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    const anoAtual = new Date().getFullYear();
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const [matriculasPorMesAgg, alunosPorMesAgg, vagasPorInstituicao, eventosCalendario] = await Promise.all([
      db.collection('matriculas').aggregate([
        { $match: { data_matricula: { $exists: true, $ne: null } } },
        { $project: { mes: { $month: '$data_matricula' }, ano: { $year: '$data_matricula' } } },
        { $group: { _id: { mes: '$mes', ano: '$ano' }, total: { $sum: 1 } } }
      ]).toArray(),
      db.collection('alunos').aggregate([
        { $match: { created_at: { $exists: true, $ne: null } } },
        { $project: { mes: { $month: '$created_at' }, ano: { $year: '$created_at' } } },
        { $group: { _id: { mes: '$mes', ano: '$ano' }, total: { $sum: 1 } } }
      ]).toArray(),
      db.collection('instituicoes').aggregate([
        { $match: { vagas_totais: { $gt: 0 } } },
        { $sort: { vagas_disponiveis: 1 } },
        { $limit: 8 },
        {
          $project: {
            name: '$nome',
            ocupadas: { $subtract: ['$vagas_totais', '$vagas_disponiveis'] },
            disponiveis: '$vagas_disponiveis'
          }
        }
      ]).toArray(),
      db.collection('calendario')
        .find({ data_inicio: { $gte: new Date() } })
        .sort({ data_inicio: 1 })
        .limit(4)
        .toArray()
    ]);

    const serieMensal = (arr, chave) => {
      const mapa = new Map(arr.map(x => [`${x._id.ano}-${x._id.mes}`, x.total]));
      const serie = [];
      for (let m = 1; m <= 12; m++) {
        serie.push({ name: mesesNomes[m - 1], [chave]: mapa.get(`${anoAtual}-${m}`) || 0 });
      }
      return serie;
    };

    res.json({
      resumo: {
        total_instituicoes: totalInstituicoes,
        total_alunos: totalAlunos,
        total_professores: totalProfessores,
        total_turmas: totalTurmas,
        total_matriculas: totalMatriculas
      },
      instituicoes_por_tipo: instituicoesPorTipo,
      alunos_por_genero: alunosPorGenero,
      vagas: vagas,
      ultimas_matriculas: ultimasMatriculas,
      alertas_recentes: alertasRecentes,
      matriculas_por_mes: serieMensal(matriculasPorMesAgg, 'matriculas'),
      alunos_por_mes: serieMensal(alunosPorMesAgg, 'alunos'),
      vagas_por_instituicao: vagasPorInstituicao,
      eventos_calendario: eventosCalendario.map(e => ({
        data: new Date(e.data_inicio).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        titulo: e.titulo,
        tipo: e.tipo
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
  }
};

const getEstatisticasProvincia = async (req, res) => {
  try {
    const db = getDB();

    const stats = await db.collection('provincias').aggregate([
      {
        $lookup: {
          from: 'municipios',
          localField: '_id',
          foreignField: 'provincia_id',
          as: 'municipios'
        }
      },
      { $unwind: { path: '$municipios', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'instituicoes',
          localField: 'municipios._id',
          foreignField: 'municipio_id',
          as: 'instituicoes'
        }
      },
      { $unwind: { path: '$instituicoes', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'alunos',
          localField: 'instituicoes._id',
          foreignField: 'instituicao_id',
          as: 'alunos'
        }
      },
      {
        $lookup: {
          from: 'professores',
          localField: 'instituicoes._id',
          foreignField: 'instituicao_id',
          as: 'professores'
        }
      },
      {
        $group: {
          _id: { provincia_id: '$_id', provincia_nome: '$nome' },
          total_instituicoes: { $addToSet: '$instituicoes._id' },
          total_alunos: { $addToSet: '$alunos._id' },
          total_professores: { $addToSet: '$professores._id' },
          total_vagas: { $sum: '$instituicoes.vagas_totais' },
          vagas_disponiveis: { $sum: '$instituicoes.vagas_disponiveis' }
        }
      },
      {
        $project: {
          _id: 0,
          provincia: '$_id.provincia_nome',
          total_instituicoes: { $size: { $ifNull: ['$total_instituicoes', []] } },
          total_alunos: { $size: { $ifNull: ['$total_alunos', []] } },
          total_professores: { $size: { $ifNull: ['$total_professores', []] } },
          total_vagas: 1,
          vagas_disponiveis: 1
        }
      }
    ]).toArray();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas provinciais' });
  }
};

const getRelatorioOcupacao = async (req, res) => {
  try {
    const db = getDB();
    const { instituicao_id } = req.query;

    const matchStage = { vagas_totais: { $gt: 0 } };
    if (instituicao_id) {
      matchStage._id = new ObjectId(instituicao_id);
    }

    const relatorio = await db.collection('instituicoes').aggregate([
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          nome: 1,
          tipo: 1,
          vagas_totais: 1,
          vagas_disponiveis: 1,
          vagas_ocupadas: { $subtract: ['$vagas_totais', '$vagas_disponiveis'] },
          percentual_ocupacao: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$vagas_totais', '$vagas_disponiveis'] }, '$vagas_totais'] },
                  100
                ]
              },
              1
            ]
          },
          status: 1
        }
      },
      { $sort: { percentual_ocupacao: -1 } }
    ]).toArray();

    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório de ocupação' });
  }
};

module.exports = {
  getDashboardStats,
  getEstatisticasProvincia,
  getRelatorioOcupacao
};
