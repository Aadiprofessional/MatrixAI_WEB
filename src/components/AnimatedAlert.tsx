import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export interface AlertOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

interface AnimatedAlertProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  options?: AlertOptions;
}

const AnimatedAlert: React.FC<AnimatedAlertProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  options = {} 
}) => {
  const { darkMode } = useTheme();
  const {
    type = 'info',
    duration = 4000,
    position = 'top-right'
  } = options;

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="w-5 h-5" />;
      case 'error':
        return <FiX className="w-5 h-5" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return darkMode 
          ? 'bg-green-900/90 text-green-100 border-green-700' 
          : 'bg-green-50 text-green-800 border-green-200';
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
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationDirection = () => {
    switch (position) {
      case 'top-right':
        return { x: 300, y: -100 };
      case 'top-center':
        return { x: 0, y: -100 };
      case 'top-left':
        return { x: -300, y: -100 };
      case 'bottom-right':
        return { x: 300, y: 100 };
      case 'bottom-center':
        return { x: 0, y: 100 };
      case 'bottom-left':
        return { x: -300, y: 100 };
      default:
        return { x: 300, y: -100 };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.8,
            ...getAnimationDirection()
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: 0,
            y: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            ...getAnimationDirection()
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className={`fixed ${getPositionStyles()} z-[9999] max-w-sm w-full mx-auto`}
        >
          <div className={`
            flex items-center p-4 rounded-lg border shadow-lg backdrop-blur-sm
            ${getColors()}
          `}>
            <div className={`flex-shrink-0 ${getIconColors()}`}>
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedAlert; 