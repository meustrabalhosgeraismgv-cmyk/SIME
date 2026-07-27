const db = require('../config/database');

const getDashboardStats = (req, res) => {
  try {
    const totalInstituicoes = db.prepare('SELECT COUNT(*) as total FROM instituicoes').get();
    const totalAlunos = db.prepare('SELECT COUNT(*) as total FROM alunos').get();
    const totalProfessores = db.prepare('SELECT COUNT(*) as total FROM professores').get();
    const totalTurmas = db.prepare('SELECT COUNT(*) as total FROM turmas').get();
    const totalMatriculas = db.prepare('SELECT COUNT(*) as total FROM matriculas WHERE estado = ?').get('ativa');

    const instituicoesPorTipo = db.prepare(`
      SELECT tipo, COUNT(*) as total 
      FROM instituicoes 
      GROUP BY tipo
    `).all();

    const alunosPorGenero = db.prepare(`
      SELECT sexo, COUNT(*) as total 
      FROM alunos 
      GROUP BY sexo
    `).all();

    const vagasGerais = db.prepare(`
      SELECT 
        SUM(vagas_totais) as total_vagas,
        SUM(vagas_disponiveis) as vagas_disponiveis,
        SUM(vagas_totais) - SUM(vagas_disponiveis) as vagas_ocupadas
      FROM instituicoes
    `).get();

    const ultimasMatriculas = db.prepare(`
      SELECT m.*, a.nome_completo as aluno_nome, t.nome as turma_nome, i.nome as instituicao_nome
      FROM matriculas m
      LEFT JOIN alunos a ON m.aluno_id = a.id
      LEFT JOIN turmas t ON m.turma_id = t.id
      LEFT JOIN instituicoes i ON t.instituicao_id = i.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `).all();

    const alertasRecentes = db.prepare(`
      SELECT * FROM alertas 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    res.json({
      resumo: {
        total_instituicoes: totalInstituicoes.total,
        total_alunos: totalAlunos.total,
        total_professores: totalProfessores.total,
        total_turmas: totalTurmas.total,
        total_matriculas: totalMatriculas.total
      },
      instituicoes_por_tipo: instituicoesPorTipo,
      alunos_por_genero: alunosPorGenero,
      vagas: vagasGerais,
      ultimas_matriculas: ultimasMatriculas,
      alertas_recentes: alertasRecentes
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
  }
};

const getEstatisticasProvincia = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        p.nome as provincia,
        COUNT(DISTINCT i.id) as total_instituicoes,
        COUNT(DISTINCT a.id) as total_alunos,
        COUNT(DISTINCT pr.id) as total_professores,
        SUM(i.vagas_totais) as total_vagas,
        SUM(i.vagas_disponiveis) as vagas_disponiveis
      FROM provincias p
      LEFT JOIN municipios m ON p.id = m.provincia_id
      LEFT JOIN instituicoes i ON m.id = i.municipio_id
      LEFT JOIN alunos a ON i.id = a.instituicao_id
      LEFT JOIN professores pr ON i.id = pr.instituicao_id
      GROUP BY p.id, p.nome
    `).all();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas provinciais' });
  }
};

const getRelatorioOcupacao = (req, res) => {
  try {
    const { instituicao_id } = req.query;

    let query = `
      SELECT 
        i.id,
        i.nome,
        i.tipo,
        i.vagas_totais,
        i.vagas_disponiveis,
        i.vagas_totais - i.vagas_disponiveis as vagas_ocupadas,
        ROUND(((i.vagas_totais - i.vagas_disponiveis) * 100.0 / i.vagas_totais), 1) as percentual_ocupacao,
        i.status
      FROM instituicoes i
      WHERE i.vagas_totais > 0
    `;

    const params = [];
    if (instituicao_id) {
      query += ' AND i.id = ?';
      params.push(instituicao_id);
    }

    query += ' ORDER BY percentual_ocupacao DESC';

    const relatorio = db.prepare(query).all(...params);

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