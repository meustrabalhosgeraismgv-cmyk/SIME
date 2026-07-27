import { useState, useEffect } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import Loading from '../components/Loading';
import StatusChip from '../components/StatusChip';
import { dashboardService } from '../services/api';

const Relatorios = () => {
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    loadRelatorio();
  }, [filtro]);

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
          <p className="text-gray-500 dark:text-gray-400">Relatório de ocupação das instituições</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

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
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                filtro === 'todos' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('critico')}
              className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                filtro === 'critico' 
                  ? 'bg-error text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Crítico
            </button>
            <button
              onClick={() => setFiltro('atencao')}
              className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                filtro === 'atencao' 
                  ? 'bg-warning text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Atenção
            </button>
            <button
              onClick={() => setFiltro('normal')}
              className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                filtro === 'normal' 
                  ? 'bg-success text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Normal
            </button>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
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
                    <td>
                      <span className="font-medium text-gray-900 dark:text-white">{item.nome}</span>
                    </td>
                    <td>
                      <span className="capitalize">{item.tipo?.replace('_', ' ')}</span>
                    </td>
                    <td className="text-center">{item.vagas_totais}</td>
                    <td className="text-center">{item.vagas_ocupadas}</td>
                    <td className="text-center font-medium text-success">{item.vagas_disponiveis}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.percentual_ocupacao >= 90 ? 'bg-error' :
                              item.percentual_ocupacao >= 70 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${item.percentual_ocupacao}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {item.percentual_ocupacao}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusChip status={getStatusOcupacao(item.percentual_ocupacao) === 'error' ? 'inativa' : 
                        getStatusOcupacao(item.percentual_ocupacao) === 'warning' ? 'em_reforma' : 'ativa'} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRelatorio.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma instituição encontrada para o filtro selecionado
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legenda</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Normal (até 70% de ocupação)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Atenção (70% - 90% de ocupação)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-error rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Crítico (acima de 90% de ocupação)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
