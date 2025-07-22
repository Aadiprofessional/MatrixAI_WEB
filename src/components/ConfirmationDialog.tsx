import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  type = 'warning'
}) => {
  const { darkMode } = useTheme();

  const getColors = () => {
    switch (type) {
      case 'error':
        return darkMode 
          ? 'bg-red-900/90 text-red-100 border-red-700' 
          : 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return darkMode 
          ? 'bg-yellow-900/90 text-yellow-100 border-yellow-700' 
          : 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return darkMode 
          ? 'bg-blue-900/90 text-blue-100 border-blue-700' 
          : 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const getIconColors = () => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FiX className="w-6 h-6" />;
      case 'warning':
      default:
        return <FiAlertTriangle className="w-6 h-6" />;
    }
  };

  const getConfirmButtonColors = () => {
    switch (type) {
      case 'error':
        return darkMode
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return darkMode
          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
          : 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return darkMode
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 max-w-sm w-full mx-4 pointer-events-auto"
          >
            <div className={`
              p-5 rounded-lg border shadow-lg ${getColors()}
            `}>
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 ${getIconColors()}`}>
                  {getIcon()}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium">
                    Confirmation
                  </h3>
                </div>
                <button
                  onClick={onCancel}
                  className={`ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm mb-6">
                {message}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCancel}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-md transition-colors ${getConfirmButtonColors()}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;