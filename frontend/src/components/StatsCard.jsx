const StatsCard = ({ icon: Icon, title, value, trend, trendValue, color = 'primary', subtitle }) => {
  const colorConfig = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-500/10',
      icon: 'text-primary-500',
      ring: 'ring-primary-500/10',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-500/10',
      icon: 'text-success-500',
      ring: 'ring-success-500/10',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      icon: 'text-warning-500',
      ring: 'ring-warning-500/10',
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-500/10',
      icon: 'text-error-500',
      ring: 'ring-error-500/10',
    },
  };

  const config = colorConfig[color] || colorConfig.primary;

  return (
    <div className="stat-card card-hover group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${config.bg} ring-1 ${config.ring} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${config.icon}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            trend === 'up' 
              ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' 
              : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
          }`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
