import { useState, useEffect } from 'react';
import { FileText, Download, Filter, BarChart3, Users, School, GraduationCap, BookOpen, AlertTriangle } from 'lucide-react';
import Loading from '../components/Loading';
import StatusChip from '../components/StatusChip';
import { dashboardService, relatorioService } from '../services/api';

const Relatorios = () => {
  const [activeTab, setActiveTab] = useState('sintese');
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const exportSintesePdf = () => {
    if (!sintese) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    const s = sintese;
    const row = (label, value) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#374151">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#111827">${value}</td></tr>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório de Síntese - Educa Mais+ Angola</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #0061a4; }
    h2 { font-size: 16px; margin: 24px 0 8px; color: #111827; }
    .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #0061a4; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .stat { flex: 1; min-width: 140px; text-align: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .stat .num { font-size: 28px; font-weight: 800; color: #0061a4; }
    .stat .lab { font-size: 12px; color: #6b7280; }
    .footer { margin-top: 32px; color: #6b7280; font-size: 11px; text-align: center; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="background:#0061a4;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px">Imprimir / Guardar PDF</button>
  </div>
  <h1>Relatório de Síntese - Educa Mais+ Angola</h1>
  <p class="sub">${s.periodo.label} • Gerado em ${new Date(s.gerado_em).toLocaleString('pt-PT')}</p>

  <div class="grid">
    <div class="stat"><div class="num">${s.resumo.total_instituicoes}</div><div class="lab">Instituições</div></div>
    <div class="stat"><div class="num">${s.resumo.total_alunos}</div><div class="lab">Alunos</div></div>
    <div class="stat"><div class="num">${s.resumo.total_professores}</div><div class="lab">Professores</div></div>
    <div class="stat"><div class="num">${s.resumo.total_turmas}</div><div class="lab">Turmas</div></div>
    <div class="stat"><div class="num">${s.resumo.total_matriculas}</div><div class="lab">Matrículas Ativas</div></div>
  </div>

  <h2>Ocupação de Vagas</h2>
  <div class="card">
    <table>
      <tr><th>Vagas Totais</th><th>Vagas Ocupadas</th><th>Vagas Disponíveis</th><th>Percentual de Ocupação</th></tr>
      <tr>
        <td style="text-align:center">${s.vagas.total_vagas}</td>
        <td style="text-align:center">${s.vagas.vagas_ocupadas}</td>
        <td style="text-align:center">${s.vagas.vagas_disponiveis}</td>
        <td style="text-align:center;font-weight:700;color:${s.vagas.percentual_ocupacao >= 70 ? '#dc2626' : '#16a34a'}">${s.vagas.percentual_ocupacao}%</td>
      </tr>
    </table>
  </div>

  <h2>Instituições por Tipo</h2>
  <div class="card">
    <table>
      <tr><th>Tipo</th><th style="text-align:center">Total</th></tr>
      ${s.instituicoes_por_tipo.length ? s.instituicoes_por_tipo.map(t => `<tr><td>${t._id}</td><td style="text-align:center">${t.total}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:#9ca3af">Sem dados</td></tr>'}
    </table>
  </div>

  <h2>Alunos por Género</h2>
  <div class="card">
    <table>
      <tr><th>Género</th><th style="text-align:center">Total</th></tr>
      ${s.alunos_por_genero.length ? s.alunos_por_genero.map(g => `<tr><td>${g._id === 'M' ? 'Masculino' : 'Feminino'}</td><td style="text-align:center">${g.total}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:#9ca3af">Sem dados</td></tr>'}
    </table>
  </div>

  ${s.evolucao_trimestres?.length ? `
  <h2>Evolução de Matrículas por Trimestre (${ano})</h2>
  <div class="card">
    <table>
      <tr><th>Trimestre</th><th style="text-align:center">Matrículas</th></tr>
      ${s.evolucao_trimestres.map(t => `<tr><td>${t.nome}</td><td style="text-align:center">${t.total}</td></tr>`).join('')}
    </table>
  </div>` : ''}

  <div class="footer">Sistema Integrado de Monitorização Escolar • República de Angola • © ${new Date().getFullYear()}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  };

  const exportOcupacaoPdf = () => {
    if (!relatorio.length) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    const rows = relatorio.map(i => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i.nome}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${(i.tipo||'').replace('_',' ')}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.vagas_totais}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.vagas_ocupadas}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.vagas_disponiveis}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.percentual_ocupacao}%</td></tr>`).join('');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"><title>Relatório de Ocupação - Educa Mais+ Angola</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; }
    h1 { font-size: 22px; color: #0061a4; margin-bottom: 4px; }
    .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0061a4; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
    .footer { margin-top: 32px; color: #6b7280; font-size: 11px; text-align: center; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px"><button onclick="window.print()" style="background:#0061a4;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px">Imprimir / Guardar PDF</button></div>
  <h1>Relatório de Ocupação das Instituições</h1>
  <p class="sub">Gerado em ${new Date().toLocaleString('pt-PT')}</p>
  <table>
    <tr><th>Instituição</th><th>Tipo</th><th>Vagas Totais</th><th>Vagas Ocupadas</th><th>Vagas Disponíveis</th><th>Ocupação</th></tr>
    ${rows}
  </table>
  <div class="footer">Sistema Integrado de Monitorização Escolar • República de Angola • © ${new Date().getFullYear()}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
          <p className="text-gray-500 dark:text-gray-400">Relatórios de síntese e ocupação das instituições</p>
        </div>
        <button
          onClick={() => activeTab === 'sintese' ? exportSintesePdf() : exportOcupacaoPdf()}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportar PDF
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
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t._id?.replace('_', ' ')}</span>
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
                      <tr key={item.id}>
                        <td><span className="font-medium text-gray-900 dark:text-white">{item.nome}</span></td>
                        <td><span className="capitalize">{item.tipo?.replace('_', ' ')}</span></td>
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
        </>
      )}
    </div>
  );
};

export default Relatorios;
