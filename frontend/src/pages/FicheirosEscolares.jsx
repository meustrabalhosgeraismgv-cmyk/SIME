import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileText, FolderOpen, Upload, Link2, CheckCircle2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusChip from '../components/StatusChip';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { documentoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIAS_DEFAULT = [
  { id: 'noticia', label: 'Notícias' },
  { id: 'aviso_publicidade', label: 'Avisos e Publicidades' },
  { id: 'edital_licenca', label: 'Editais para Licenças' },
  { id: 'visita', label: 'Visitas' },
  { id: 'potencialidade', label: 'Potencialidades' },
  { id: 'geral', label: 'Geral' },
];

const FicheirosEscolares = () => {
  const { hasRole, user } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'noticia',
    referencia: '',
    numero: '',
    ficheiro_url: '',
    imagem_url: '',
    instituicao_id: '',
    data_documento: ''
  });

  const canEdit = hasRole('admin', 'instituicao', 'diretor');
  const isAdmin = hasRole('admin');

  useEffect(() => {
    documentoService.getCategorias()
      .then(res => {
        if (res.data?.data?.length) setCategorias(res.data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDocumentos();
  }, [pagination.page, categoriaAtiva]);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      const response = await documentoService.getAll({
        page: pagination.page,
        limit: 10,
        search,
        categoria: categoriaAtiva,
        incluir_pendentes: 1,
        ...(!isAdmin && user?.entidade_id ? { instituicao_id: user.entidade_id } : {})
      });
      setDocumentos(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadDocumentos();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await documentoService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Documento atualizado com sucesso!' });
      } else {
        await documentoService.create({ ...formData, instituicao_id: formData.instituicao_id || user?.entidade_id || '' });
        setAlert({ type: 'success', message: isAdmin ? 'Documento registado com sucesso!' : 'Documento registado! Aguarda aprovação do administrador para ser público.' });
      }
      setShowModal(false);
      resetForm();
      loadDocumentos();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao guardar documento' });
    }
  };

  const handleEdit = (doc) => {
    setFormData({
      titulo: doc.titulo,
      descricao: doc.descricao || '',
      categoria: doc.categoria || 'noticia',
      referencia: doc.referencia || '',
      numero: doc.numero || '',
      ficheiro_url: doc.ficheiro_url || '',
      imagem_url: doc.imagem_url || '',
      instituicao_id: doc.instituicao_id || '',
      data_documento: doc.data_documento ? doc.data_documento.slice(0, 10) : ''
    });
    setEditingId(doc.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja eliminar este documento?')) {
      try {
        await documentoService.delete(id);
        setAlert({ type: 'success', message: 'Documento eliminado com sucesso!' });
        loadDocumentos();
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao eliminar documento' });
      }
    }
  };

  const handleAprovar = async (id) => {
    if (!window.confirm('Aprovar este documento? Ficará visível no site público.')) return;
    try {
      await documentoService.update(id, { publicado: 1 });
      setAlert({ type: 'success', message: 'Documento aprovado e publicado!' });
      loadDocumentos();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Erro ao aprovar documento' });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      categoria: categoriaAtiva || 'noticia',
      referencia: '',
      numero: '',
      ficheiro_url: '',
      imagem_url: '',
      instituicao_id: isAdmin ? '' : (user?.entidade_id || ''),
      data_documento: ''
    });
    setEditingId(null);
  };

  const columns = [
    { header: 'Título', accessor: 'titulo', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">{row.titulo}</span>
    )},
    { header: 'Categoria', accessor: 'categoria_label', render: (row) => (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
        {row.categoria_label || row.categoria}
      </span>
    )},
    { header: 'Referência', accessor: 'referencia' },
    { header: 'Nº', accessor: 'numero' },
    { header: 'Instituição', accessor: 'instituicao_nome' },
    { header: 'Estado', accessor: 'publicado', render: (row) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.publicado === 1 ? 'bg-success/10 text-success dark:text-success-light' : 'bg-warning/10 text-warning dark:text-warning-light'}`}>
        {row.publicado === 1 ? 'Publicado' : 'Pendente'}
      </span>
    )},
    { header: 'Data', accessor: 'data_documento', render: (row) => (
      <span>{row.data_documento ? new Date(row.data_documento).toLocaleDateString('pt-PT') : '—'}</span>
    )},
    { header: 'Ações', accessor: 'acoes', render: (row) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedDoc(row); }}
          className="p-2 hover:bg-primary/10 rounded-lg text-primary dark:text-primary-light dark:hover:bg-primary/20"
          title="Ver"
        >
          <Eye className="w-4 h-4" />
        </button>
        {isAdmin && row.publicado !== 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleAprovar(row.id); }}
            className="p-2 hover:bg-success/10 rounded-lg text-success dark:text-success-light dark:hover:bg-success/20"
            title="Aprovar (tornar público)"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        {canEdit && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              className="p-2 hover:bg-warning/10 rounded-lg text-warning dark:text-warning-light dark:hover:bg-warning/20"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
              className="p-2 hover:bg-error/10 rounded-lg text-error dark:text-error-light dark:hover:bg-error/20"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ficheiros Escolares</h2>
          <p className="text-gray-500 dark:text-gray-400">Denominação e gestão dos ficheiros escolares (TDR - Informativo)</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Documento
          </button>
        )}
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoriaAtiva('')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              categoriaAtiva === '' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                categoriaAtiva === cat.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white dark:bg-navy-900 rounded-2xl shadow-card p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título ou descrição..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">Pesquisar</button>
        </div>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={documentos}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onRowClick={(row) => setSelectedDoc(row)}
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Documento' : 'Novo Documento'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
              <input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria *</label>
              <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="input-field" required>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número / Código</label>
              <input type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referência</label>
              <input type="text" value={formData.referencia} onChange={(e) => setFormData({ ...formData, referencia: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Documento</label>
              <input type="date" value={formData.data_documento} onChange={(e) => setFormData({ ...formData, data_documento: e.target.value })} className="input-field" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <textarea rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ficheiro (URL)</label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="url" value={formData.ficheiro_url} onChange={(e) => setFormData({ ...formData, ficheiro_url: e.target.value })} className="input-field pl-9" placeholder="https://... (PDF, docx)" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagem (URL)</label>
              <input type="url" value={formData.imagem_url} onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })} className="input-field" placeholder="https://... (capa)" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID da Instituição</label>
              <input type="text" value={formData.instituicao_id} onChange={(e) => setFormData({ ...formData, instituicao_id: e.target.value })} className="input-field" placeholder="Opcional" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editingId ? 'Guardar Alterações' : 'Registar Documento'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={selectedDoc?.titulo || 'Detalhes'} size="lg">
        {selectedDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Categoria</p>
                <span className="px-3 py-1 inline-block mt-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                  {selectedDoc.categoria_label || selectedDoc.categoria}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                <span className={`px-3 py-1 inline-block mt-1 rounded-full text-xs font-semibold ${selectedDoc.publicado === 1 ? 'bg-success/10 text-success dark:text-success-light' : 'bg-warning/10 text-warning dark:text-warning-light'}`}>
                  {selectedDoc.publicado === 1 ? 'Publicado' : 'Pendente (aguarda aprovação)'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Referência</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.referencia || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Número</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.numero || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{selectedDoc.descricao || 'Sem descrição'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instituição</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.instituicao_nome || 'Geral'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Autor</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.autor || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data do documento</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.data_documento ? new Date(selectedDoc.data_documento).toLocaleDateString('pt-PT') : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Registado em</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedDoc.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>

            {(selectedDoc.ficheiro_url || selectedDoc.imagem_url) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedDoc.ficheiro_url && (
                  <a href={selectedDoc.ficheiro_url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Abrir ficheiro
                  </a>
                )}
                {selectedDoc.imagem_url && (
                  <a href={selectedDoc.imagem_url} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Ver imagem
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FicheirosEscolares;
