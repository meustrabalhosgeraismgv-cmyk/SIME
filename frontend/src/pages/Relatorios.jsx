import { useState, useEffect } from 'react';
import { FileText, Download, Filter, BarChart3, Users, School, GraduationCap, BookOpen, AlertTriangle, FileDown } from 'lucide-react';
import Loading from '../components/Loading';
import StatusChip from '../components/StatusChip';
import { dashboardService, relatorioService } from '../services/api';
import { carregarLogo, criarPdf, cabecalhoPagina, rodapePaginas, secaoPDF, tabelaPDF, formatNumero, formatData } from '../utils/pdfUtils';

const TIPO_LABEL = {
  pre_escolar: 'Pré-Escolar',
  ensino_primario: 'Primário',
  ensino_medio: 'Médio'
};

const Relatorios = () => {
  const [activeTab, setActiveTab] = useState('sintese');
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  const [sintese, setSintese] = useState(null);
  const [periodo, setPeriodo] = useState('geral');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [trimestre, setTrimestre] = useState(1);

  useEffect(() => {
    loadRelatorio();
  }, [filtro]);

  useEffect(() => {
    loadSintese();
  }, [periodo, ano, trimestre]);

  const loadRelatorio = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getOcupacao();
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSintese = async () => {
    try {
      setLoading(true);
      const params = { periodo };
      if (periodo === 'trimestral') {
        params.ano = ano;
        params.trimestre = trimestre;
      }
      const response = await relatorioService.getSintese(params);
      setSintese(response.data);
    } catch (error) {
      console.error('Erro ao carregar síntese:', error);
      setSintese(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusOcupacao = (percentual) => {
    if (percentual >= 90) return 'error';
    if (percentual >= 70) return 'warning';
    return 'success';
  };

  const getStatusLabel = (percentual) => {
    if (percentual >= 90) return 'Crítico';
    if (percentual >= 70) return 'Atenção';
    return 'Normal';
  };

  const filteredRelatorio = relatorio.filter(item => {
    if (filtro === 'critico') return item.percentual_ocupacao >= 90;
    if (filtro === 'atencao') return item.percentual_ocupacao >= 70 && item.percentual_ocupacao < 90;
    if (filtro === 'normal') return item.percentual_ocupacao < 70;
    return true;
  });

  const stats = {
    total: relatorio.length,
    criticos: relatorio.filter(i => i.percentual_ocupacao >= 90).length,
    atencao: relatorio.filter(i => i.percentual_ocupacao >= 70 && i.percentual_ocupacao < 90).length,
    normais: relatorio.filter(i => i.percentual_ocupacao < 70).length
  };

  const sinteseNarrativa = () => {
    if (!sintese) return '';
    const r = sintese.resumo;
    const v = sintese.vagas;
    const ocupacao = v?.percentual_ocupacao || 0;
    const estado = ocupacao >= 90 ? 'situação crítica de ocupação' : ocupacao >= 70 ? 'elevada procura' : 'situação confortável';
    const tipoMais = sintese.instituicoes_por_tipo?.length
      ? TIPO_LABEL[sintese.instituicoes_por_tipo[0]._id] || sintese.instituicoes_por_tipo[0]._id
      : '—';
    return `O presente relatório apresenta a síntese da realidade do sistema educativo. Existem actualmente ${formatNumero(r?.total_instituicoes)} instituições de ensino, com ${formatNumero(r?.total_alunos)} alunos matriculados, apoiados por ${formatNumero(r?.total_professores)} professores e organizados em ${formatNumero(r?.total_turmas)} turmas. As vagas existentes totalizam ${formatNumero(v?.total_vagas)}, das quais ${formatNumero(v?.vagas_disponiveis)} estão disponíveis (${formatNumero(ocupacao, 1)}% de ocupação), o que reflecte ${estado}. ${tipoMais !== '—' ? `O subsistema de ensino ${tipoMais.toLowerCase()} é o mais representado.` : ''} Ao longo do período registaram-se ${formatNumero(r?.solicitacoes)} solicitações e ${formatNumero(r?.denuncias)} denúncias.`;
  };

  const gerarPdfSintese = async () => {
    const s = sintese;
    const logo = await carregarLogo();
    const doc = criarPdf();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 12;

    cabecalhoPagina(doc, {
      titulo: 'Relatório de Síntese',
      subtitulo: `${s.periodo.label} • Gerado em ${formatData(s.gerado_em)}`,
      logo
    });
    doc.y = 42;

    secaoPDF(doc, 1, 'Indicadores Gerais', { pw, ph, m });
    tabelaPDF(doc, ['Indicador', 'Total'], [
      ['Instituições de Ensino', formatNumero(s.resumo.total_instituicoes)],
      ['Alunos Matriculados', formatNumero(s.resumo.total_alunos)],
      ['Professores', formatNumero(s.resumo.total_professores)],
      ['Turmas', formatNumero(s.resumo.total_turmas)],
      ['Matrículas Activas', formatNumero(s.resumo.total_matriculas)]
    ], { m });

    secaoPDF(doc, 2, 'Ocupação de Vagas', { pw, ph, m });
    tabelaPDF(doc, ['Vagas Totais', 'Vagas Ocupadas', 'Vagas Disponíveis', 'Ocupação (%)'], [
      [formatNumero(s.vagas.total_vagas), formatNumero(s.vagas.vagas_ocupadas), formatNumero(s.vagas.vagas_disponiveis), formatNumero(s.vagas.percentual_ocupacao, 1)]
    ], { m, headColor: [16, 185, 129] });

    secaoPDF(doc, 3, 'Instituições por Tipo', { pw, ph, m });
    if (s.instituicoes_por_tipo?.length) {
      tabelaPDF(doc, ['Tipo de Ensino', 'Total'], s.instituicoes_por_tipo.map(t => [TIPO_LABEL[t._id] || t._id, formatNumero(t.total)]), { m });
    } else {
      doc.text('Sem dados.', m, doc.y); doc.y += 6;
    }

    secaoPDF(doc, 4, 'Alunos por Género', { pw, ph, m });
    if (s.alunos_por_genero?.length) {
      tabelaPDF(doc, ['Género', 'Total'], s.alunos_por_genero.map(g => [g._id === 'M' ? 'Masculino' : 'Feminino', formatNumero(g.total)]), { m });
    } else {
      doc.text('Sem dados.', m, doc.y); doc.y += 6;
    }

    if (s.alunos_por_estado?.length) {
      secaoPDF(doc, 5, 'Alunos por Estado', { pw, ph, m });
      tabelaPDF(doc, ['Estado', 'Total'], s.alunos_por_estado.map(e => [e._id || '-', formatNumero(e.total)]), { m });
    }

    if (s.evolucao_trimestres?.length) {
      secaoPDF(doc, 6, 'Matrículas por Trimestre', { pw, ph, m });
      tabelaPDF(doc, ['Trimestre', 'Matrículas'], s.evolucao_trimestres.map(t => [t.nome, formatNumero(t.total)]), { m, headColor: [245, 158, 11] });
    }

    secaoPDF(doc, 7, 'Actividade do Sistema', { pw, ph, m });
    tabelaPDF(doc, ['Item', 'Total'], [
      ['Notícias Publicadas', formatNumero(s.resumo.noticias)],
      ['Comunicados', formatNumero(s.resumo.comunicados)],
      ['Solicitações', formatNumero(s.resumo.solicitacoes)],
      ['Denúncias / SOS', formatNumero(s.resumo.denuncias)]
    ], { m });

    secaoPDF(doc, 8, 'Análise e Conclusão', { pw, ph, m });
    const narrativa = sinteseNarrativa();
    const lines = doc.splitTextToSize(narrativa, pw - 2 * m);
    for (const line of lines) {
      if (doc.y + 5 > ph - 15) { doc.addPage(); doc.y = 22; }
      doc.text(line, m, doc.y);
      doc.y += 5;
    }
    doc.y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 140);
    doc.text('Documento gerado automaticamente pelo SIME - Educa Mais+ Angola.', m, doc.y);

    rodapePaginas(doc);
    doc.save(`Relatorio_Sintese_SIME_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const gerarPdfOcupacao = async () => {
    const logo = await carregarLogo();
    const doc = criarPdf();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 12;

    cabecalhoPagina(doc, {
      titulo: 'Relatório de Ocupação das Instituições',
      subtitulo: `Gerado em ${formatData(new Date().toISOString())}`,
      logo
    });
    doc.y = 42;

    secaoPDF(doc, 1, 'Síntese de Ocupação', { pw, ph, m });
    tabelaPDF(doc, ['Situação', 'Nº de Escolas'], [
      ['Total de Escolas', formatNumero(stats.total)],
      ['Situação Crítica (≥ 90%)', formatNumero(stats.criticos)],
      ['Necessita Atenção (70% - 90%)', formatNumero(stats.atencao)],
      ['Situação Normal (< 70%)', formatNumero(stats.normais)]
    ], { m, headColor: [245, 158, 11] });

    secaoPDF(doc, 2, 'Instituições por Ocupação', { pw, ph, m });
    if (relatorio.length) {
      tabelaPDF(doc, ['Instituição', 'Tipo', 'Vagas Totais', 'Ocupadas', 'Disponíveis', 'Ocupação (%)'],
        relatorio.map(i => [
          i.nome || '-',
          TIPO_LABEL[i.tipo] || String(i.tipo || '').replace('_', ' ') || '-',
          formatNumero(i.vagas_totais),
          formatNumero(i.vagas_ocupadas),
          formatNumero(i.vagas_disponiveis),
          formatNumero(i.percentual_ocupacao, 1)
        ]),
        { m });
    } else {
      doc.text('Sem dados.', m, doc.y); doc.y += 6;
    }

    const criticas = relatorio.filter(i => i.percentual_ocupacao >= 70);
    if (criticas.length) {
      secaoPDF(doc, 3, 'Alertas de Ocupação', { pw, ph, m });
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
      doc.roundedRect(m, doc.y, pw - 2 * m, 18, 1.5, 1.5, 'FD');
      doc.setTextColor(127, 29, 29);
      doc.setFontSize(9);
      doc.text(`Existem ${formatNumero(criticas.length)} instituições com ocupação igual ou superior a 70%.`, m + 4, doc.y + 6);
      doc.text('Recomenda-se monitorização das vagas e reforço da capacidade para os próximos períodos lectivos.', m + 4, doc.y + 12);
      doc.y += 22;
      tabelaPDF(doc, ['Instituição', 'Ocupação (%)', 'Situação'],
        criticas.slice(0, 15).map(i => [i.nome || '-', formatNumero(i.percentual_ocupacao, 1), getStatusLabel(i.percentual_ocupacao)]),
        { m, headColor: [220, 38, 38] });
    }

    rodapePaginas(doc);
    doc.save(`Relatorio_Ocupacao_SIME_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportarPdf = async () => {
    setExporting(true);
    try {
      if (activeTab === 'sintese') {
        if (!sintese) return;
        await gerarPdfSintese();
      } else {
        if (!relatorio.length) return;
        await gerarPdfOcupacao();
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card overflow-hidden">
      <div className="sime-gradient px-6 py-5 flex items-center gap-4">
        <img src="/Logotipo.png" alt="SIME" className="w-12 h-12 rounded-xl bg-white/20 p-1 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">Relatório de Síntese</h3>
          <p className="text-sm text-white/70">
            {sintese?.periodo?.label || 'Geral'} • Gerado em {sintese ? formatData(sintese.gerado_em) : formatData(new Date().toISOString())}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
          <School className="w-4 h-4 text-white" />
          <span className="text-xs text-white font-medium">Educa Mais+ Angola</span>
        </div>
      </div>
    </div>
  );

  const renderAlertas = () => {
    const criticas = relatorio.filter(i => i.percentual_ocupacao >= 90);
    const atencao = relatorio.filter(i => i.percentual_ocupacao >= 70 && i.percentual_ocupacao < 90);
    if (!criticas.length && !atencao.length) return null;
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 border-l-4 border-error">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-error" />
          Alertas de Ocupação
        </h3>
        <div className="space-y-3">
          {criticas.slice(0, 5).map(i => (
            <div key={i._id || i.id} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{i.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{TIPO_LABEL[i.tipo] || i.tipo?.replace('_', ' ')}</p>
              </div>
              <span className="text-sm font-bold text-error">{i.percentual_ocupacao}% • Crítico</span>
            </div>
          ))}
          {atencao.slice(0, 5).map(i => (
            <div key={i._id || i.id} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{i.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{TIPO_LABEL[i.tipo] || i.tipo?.replace('_', ' ')}</p>
              </div>
              <span className="text-sm font-bold text-warning">{i.percentual_ocupacao}% • Atenção</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
          <p className="text-gray-500 dark:text-gray-400">Relatórios de síntese e ocupação das instituições</p>
        </div>
        <button
          onClick={exportarPdf}
          disabled={exporting || (activeTab === 'sintese' && !sintese) || (activeTab === 'ocupacao' && !relatorio.length)}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? <FileDown className="w-5 h-5 animate-pulse" /> : <Download className="w-5 h-5" />}
          {exporting ? 'A gerar PDF...' : 'Exportar PDF'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('sintese')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${activeTab === 'sintese' ? 'bg-primary text-white' : 'bg-white dark:bg-navy-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-navy-700'}`}
        >
          Síntese Geral
        </button>
        <button
          onClick={() => setActiveTab('ocupacao')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${activeTab === 'ocupacao' ? 'bg-primary text-white' : 'bg-white dark:bg-navy-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-navy-700'}`}
        >
          Ocupação das Escolas
        </button>
      </div>

      {activeTab === 'sintese' && (
        <>
          {sintese && renderHeader()}

          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="input-field w-auto">
                <option value="geral">Geral (todos os períodos)</option>
                <option value="trimestral">Trimestral</option>
              </select>
              {periodo === 'trimestral' && (
                <>
                  <select value={trimestre} onChange={(e) => setTrimestre(parseInt(e.target.value))} className="input-field w-auto">
                    <option value={1}>1º Trimestre</option>
                    <option value={2}>2º Trimestre</option>
                    <option value={3}>3º Trimestre</option>
                    <option value={4}>4º Trimestre</option>
                  </select>
                  <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="input-field w-auto">
                    {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </>
              )}
              {sintese?.periodo && (
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{sintese.periodo.label}</span>
              )}
            </div>
          </div>

          {loading ? <Loading /> : !sintese ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Sem dados para o período selecionado.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
                  <School className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sintese.resumo.total_instituicoes}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Instituições</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
                  <Users className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sintese.resumo.total_alunos}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alunos</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
                  <GraduationCap className="w-6 h-6 text-warning mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sintese.resumo.total_professores}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Professores</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
                  <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sintese.resumo.total_turmas}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Turmas</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
                  <BarChart3 className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sintese.resumo.total_matriculas}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Matrículas</p>
                </div>
              </div>

              <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 border-l-4 border-primary">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Análise Executiva
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{sinteseNarrativa()}</p>
              </div>

              <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ocupação de Vagas</h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Vagas Ocupadas {sintese.vagas.vagas_ocupadas}/{sintese.vagas.total_vagas}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{sintese.vagas.percentual_ocupacao}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full ${sintese.vagas.percentual_ocupacao >= 70 ? 'bg-error' : 'bg-success'}`} style={{ width: `${Math.min(sintese.vagas.percentual_ocupacao, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{sintese.vagas.vagas_disponiveis}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Disponíveis</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{sintese.vagas.vagas_ocupadas}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ocupadas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instituições por Tipo</h3>
                  {sintese.instituicoes_por_tipo.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>
                  ) : (
                    <div className="space-y-3">
                      {sintese.instituicoes_por_tipo.map(t => (
                        <div key={t._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{TIPO_LABEL[t._id] || t._id?.replace('_', ' ')}</span>
                          <div className="flex items-center gap-3 flex-1 max-w-[40%]">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="h-2 rounded-full bg-primary" style={{ width: `${(t.total / sintese.resumo.total_instituicoes) * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{t.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alunos por Género</h3>
                  {sintese.alunos_por_genero.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>
                  ) : (
                    <div className="space-y-3">
                      {sintese.alunos_por_genero.map(g => (
                        <div key={g._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{g._id === 'M' ? 'Masculino' : 'Feminino'}</span>
                          <div className="flex items-center gap-3 flex-1 max-w-[40%]">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${g._id === 'M' ? 'bg-primary' : 'bg-pink-500'}`} style={{ width: `${sintese.resumo.total_alunos ? (g.total / sintese.resumo.total_alunos) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{g.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {sintese.alunos_por_estado?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alunos por Estado</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {sintese.alunos_por_estado.map(e => (
                        <div key={e._id} className="bg-gray-50 dark:bg-navy-800 rounded-2xl p-4 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{e._id || '—'}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{e.total}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sintese.evolucao_trimestres?.length > 0 && (
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matrículas por Trimestre ({ano})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sintese.evolucao_trimestres.map(t => (
                      <div key={t.nome} className="bg-gray-50 dark:bg-navy-800 rounded-2xl p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.nome}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{t.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-4 text-center border-l-4 border-primary">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{sintese.resumo.noticias}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Notícias</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-4 text-center border-l-4 border-warning">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{sintese.resumo.comunicados}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comunicados</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-4 text-center border-l-4 border-success">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{sintese.resumo.solicitacoes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solicitações</p>
                </div>
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-4 text-center border-l-4 border-error">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{sintese.resumo.denuncias}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Denúncias/SOS</p>
                </div>
              </div>

              {renderAlertas()}
            </>
          )}
        </>
      )}

      {activeTab === 'ocupacao' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Escolas</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-error">
              <p className="text-3xl font-bold text-error">{stats.criticos}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Situação Crítica</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-warning">
              <p className="text-3xl font-bold text-warning">{stats.atencao}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Necessita Atenção</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6 text-center border-l-4 border-success">
              <p className="text-3xl font-bold text-success">{stats.normais}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Situação Normal</p>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtrar por situação:</span>
              <div className="flex gap-2">
                <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-2xl font-medium transition-colors ${filtro === 'todos' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Todos</button>
                <button onClick={() => setFiltro('critico')} className={`px-4 py-2 rounded-2xl font-medium transition-colors ${filtro === 'critico' ? 'bg-error text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Crítico</button>
                <button onClick={() => setFiltro('atencao')} className={`px-4 py-2 rounded-2xl font-medium transition-colors ${filtro === 'atencao' ? 'bg-warning text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Atenção</button>
                <button onClick={() => setFiltro('normal')} className={`px-4 py-2 rounded-2xl font-medium transition-colors ${filtro === 'normal' ? 'bg-success text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Normal</button>
              </div>
            </div>

            {loading ? <Loading /> : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Instituição</th>
                      <th>Tipo</th>
                      <th>Vagas Totais</th>
                      <th>Vagas Ocupadas</th>
                      <th>Vagas Disponíveis</th>
                      <th>Ocupação</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRelatorio.map((item) => (
                      <tr key={item._id || item.id}>
                        <td><span className="font-medium text-gray-900 dark:text-white">{item.nome}</span></td>
                        <td><span className="capitalize">{TIPO_LABEL[item.tipo] || item.tipo?.replace('_', ' ')}</span></td>
                        <td className="text-center">{item.vagas_totais}</td>
                        <td className="text-center">{item.vagas_ocupadas}</td>
                        <td className="text-center font-medium text-success">{item.vagas_disponiveis}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${item.percentual_ocupacao >= 90 ? 'bg-error' : item.percentual_ocupacao >= 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${item.percentual_ocupacao}%` }}></div>
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{item.percentual_ocupacao}%</span>
                          </div>
                        </td>
                        <td>
                          <StatusChip status={getStatusOcupacao(item.percentual_ocupacao) === 'error' ? 'inativa' : getStatusOcupacao(item.percentual_ocupacao) === 'warning' ? 'em_reforma' : 'ativa'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRelatorio.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma instituição encontrada para o filtro selecionado</div>
                )}
              </div>
            )}
          </div>

          {renderAlertas()}
        </>
      )}
    </div>
  );
};

export default Relatorios;
