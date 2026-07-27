const StatusChip = ({ status, size = 'md' }) => {
  const statusConfig = {
    ativa: { label: 'Ativa', color: 'success' },
    inativa: { label: 'Inativa', color: 'error' },
    em_reforma: { label: 'Em Reforma', color: 'warning' },
    ativo: { label: 'Ativo', color: 'success' },
    transferido: { label: 'Transferido', color: 'warning' },
    abandono: { label: 'Abandono', color: 'error' },
    concluido: { label: 'Concluído', color: 'primary' },
    aposentado: { label: 'Aposentado', color: 'gray' },
    afastado: { label: 'Afastado', color: 'warning' },
    cancelada: { label: 'Cancelada', color: 'error' },
    concluida: { label: 'Concluída', color: 'success' },
  };

  const config = statusConfig[status] || { label: status, color: 'gray' };
  
  const colorClasses = {
    success: 'bg-success-50 text-success-600 ring-success-500/20 dark:bg-success-500/10 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400',
    error: 'bg-error-50 text-error-600 ring-error-500/20 dark:bg-error-500/10 dark:text-error-400',
    primary: 'bg-primary-50 text-primary-600 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400',
    gray: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`status-chip rounded-full font-semibold ring-1 ${colorClasses[config.color]} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        config.color === 'success' ? 'bg-success-500' :
        config.color === 'warning' ? 'bg-warning-500' :
        config.color === 'error' ? 'bg-error-500' :
        config.color === 'primary' ? 'bg-primary-500' : 'bg-gray-400'
      }`}></span>
      {config.label}
    </span>
  );
};

export default StatusChip;
