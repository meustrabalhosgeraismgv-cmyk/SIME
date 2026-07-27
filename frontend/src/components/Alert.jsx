import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose, title }) => {
  const styles = {
    info: {
      bg: 'bg-primary-50 dark:bg-primary-500/10',
      border: 'border-primary-200 dark:border-primary-500/20',
      text: 'text-primary-700 dark:text-primary-400',
      icon: Info,
      iconBg: 'bg-primary-100 dark:bg-primary-500/20',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-500/10',
      border: 'border-success-200 dark:border-success-500/20',
      text: 'text-success-700 dark:text-success-400',
      icon: CheckCircle,
      iconBg: 'bg-success-100 dark:bg-success-500/20',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      border: 'border-warning-200 dark:border-warning-500/20',
      text: 'text-warning-700 dark:text-warning-400',
      icon: AlertTriangle,
      iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-500/10',
      border: 'border-error-200 dark:border-error-500/20',
      text: 'text-error-700 dark:text-error-400',
      icon: AlertCircle,
      iconBg: 'bg-error-100 dark:bg-error-500/20',
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border} animate-slide-down`}>
      <div className={`p-1.5 rounded-lg ${style.iconBg} flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${style.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold text-sm ${style.text}`}>{title}</p>
        )}
        <p className={`text-sm ${style.text} ${title ? 'mt-0.5' : ''}`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className={`p-1 hover:opacity-70 rounded-lg ${style.text}`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
