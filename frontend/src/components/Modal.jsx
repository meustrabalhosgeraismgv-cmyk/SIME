import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
          onClick={onClose}
        ></div>
        
        <div className={`relative bg-white dark:bg-navy-900 rounded-2xl shadow-float w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-scale-in`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
