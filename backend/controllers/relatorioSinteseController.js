const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const TRIMESTRES = [
  { id: 1, label: '1º Trimestre', meses: [1, 2, 3] },
  { id: 2, label: '2º Trimestre', meses: [4, 5, 6] },
  { id: 3, label: '3º Trimestre', meses: [7, 8, 9] },
  { id: 4, label: '4º Trimestre', meses: [10, 11, 12] }
];

const getPeriodoFiltro = (periodo, ano, trimestre) => {
  if (periodo !== 'trimestral') return null;

  const anoNum = parseInt(ano) || new Date().getFullYear();
  const tri = TRIMESTRES.find(t => t.id === parseInt(trimestre)) || TRIMESTRES[0];
  const inicio = new Date(anoNum, tri.meses[0] - 1, 1);
  const fim = new Date(anoNum, tri.meses[2], 0, 23, 59, 59);

  return {
    label: `${tri.label} ${anoNum}`,
    inicio,
    fim
  };
};

const getRelatorioSintese = async (req, res) => {
  try {
    const db = getDB();
    const { periodo = 'geral', ano, trimestre } = req.query;

    const periodoFiltro = getPeriodoFiltro(periodo, ano, trimestre);
    const filtroTempo = periodoFiltro
      ? { $and: [{ created_at: { $gte: periodoFiltro.inicio } }, { created_at: { $lte: periodoFiltro.fim } }] }
      : {};

    const totalInstituicoes = await db.collection('instituicoes').countDocuments(filtroTempo);
    const totalAlunos = await db.collection('alunos').countDocuments(filtroTempo);
    const totalProfessores = await db.collection('professores').countDocuments(filtroTempo);
    const totalTurmas = await db.collection('turmas').countDocuments(filtroTempo);
    const totalMatriculas = await db.collection('matriculas').countDocuments({ ...filtroTempo, estado: 'ativa' });

    const instituicoesPorTipo = await db.collection('instituicoes').aggregate([
      { $match: filtroTempo },
      { $group: { _id: '$tipo', total: { $sum: 1 } } }
    ]).toArray();

    const alunosPorGenero = await db.collection('alunos').aggregate([
      { $match: filtroTempo },
      { $group: { _id: '$sexo', total: { $sum: 1 } } }
    ]).toArray();

    const alunosPorEstado = await db.collection('alunos').aggregate([
      { $match: filtroTempo },
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]).toArray();

    const vagasGerais = await db.collection('instituicoes').aggregate([
      {
        $group: {
          _id: null,
          total_vagas: { $sum: { $ifNull: ['$vagas_totais', 0] } },
          vagas_disponiveis: { $sum: { $ifNull: ['$vagas_disponiveis', 0] } }
        }
      }
    ]).toArray();
    const vagas = vagasGerais[0] || { total_vagas: 0, vagas_disponiveis: 0 };
    vagas.vagas_ocupadas = (vagas.total_vagas || 0) - (vagas.vagas_disponiveis || 0);
    vagas.percentual_ocupacao = vagas.total_vagas
      ? Math.round(((vagas.vagas_ocupadas / vagas.total_vagas) * 100) * 10) / 10
      : 0;

    let matriculasPorMes = [];
    let evolucaoTrimestres = [];

    if (periodo === 'trimestral' && periodoFiltro) {
      matriculasPorMes = await db.collection('matriculas').aggregate([
        { $match: { created_at: { $gte: periodoFiltro.inicio, $lte: periodoFiltro.fim } } },
        { $project: { mes: { $month: '$created_at' } } },
        { $group: { _id: '$mes', total: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();
    } else {
      const anoAtual = parseInt(ano) || new Date().getFullYear();
      for (const tri of TRIMESTRES) {
        const inicio = new Date(anoAtual, tri.meses[0] - 1, 1);
        const fim = new Date(anoAtual, tri.meses[2], 0, 23, 59, 59);
        const total = await db.collection('matriculas').countDocuments({
          created_at: { $gte: inicio, $lte: fim },
          estado: 'ativa'
        });
        evolucaoTrimestres.push({ nome: tri.label, total });
      }
    }

    const noticiasTotal = await db.collection('noticias').countDocuments({ publicada: 1 });
    const comunicadosTotal = await db.collection('comunicados').countDocuments({ publicado: 1 });
    const solicitacoesTotal = await db.collection('solicitacoes').countDocuments(filtroTempo);
    const denunciasTotal = await db.collection('denuncias')?.countDocuments ? await db.collection('denuncias').countDocuments(filtroTempo) : 0;

    res.json({
      periodo: {
        tipo: periodo,
        label: periodoFiltro ? periodoFiltro.label : 'Geral (todos os períodos)',
        trimestre: periodo === 'trimestral' ? parseInt(trimestre) || 1 : null,
        ano: periodo === 'trimestral' ? (parseInt(ano) || new Date().getFullYear()) : null
      },
      resumo: {
        total_instituicoes: totalInstituicoes,
        total_alunos: totalAlunos,
        total_professores: totalProfessores,
        total_turmas: totalTurmas,
        total_matriculas: totalMatriculas,
        noticias: noticiasTotal,
        comunicados: comunicadosTotal,
        solicitacoes: solicitacoesTotal,
        denuncias: denunciasTotal
      },
      instituicoes_por_tipo: instituicoesPorTipo,
      alunos_por_genero: alunosPorGenero,
      alunos_por_estado: alunosPorEstado,
      vagas,
      matriculas_por_mes: matriculasPorMes,
      evolucao_trimestres: evolucaoTrimestres,
      gerado_em: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no relatório síntese:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório síntese' });
  }
};

module.exports = { getRelatorioSintese };
