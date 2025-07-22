import React, { createContext, useContext, useState, ReactNode } from 'react';
import AnimatedAlert, { AlertOptions } from '../components/AnimatedAlert';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface Alert {
  id: string;
  message: string;
  options?: AlertOptions;
}

interface Confirmation {
  id: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info';
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => string;
  removeAlert: (id: string) => void;
  removeAllAlerts: () => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showConfirmation: (message: string, onConfirm: () => void, onCancel?: () => void, options?: {
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'error' | 'info';
  }) => string;
  removeConfirmation: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);

  const showAlert = (message: string, options?: AlertOptions) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newAlert: Alert = { id, message, options };
    
    setAlerts(prev => [...prev, newAlert]);
    
    return id;
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const removeAllAlerts = () => {
    setAlerts([]);
  };

  // Convenience methods
  const showSuccess = (message: string, duration?: number) => 
    showAlert(message, { type: 'success', duration });

  const showError = (message: string, duration?: number) => 
    showAlert(message, { type: 'error', duration });

  const showWarning = (message: string, duration?: number) => 
    showAlert(message, { type: 'warning', duration });

  const showInfo = (message: string, duration?: number) => 
    showAlert(message, { type: 'info', duration });

  const showConfirmation = (message: string, onConfirm: () => void, onCancel?: () => void, options?: {
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'error' | 'info';
  }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newConfirmation: Confirmation = { 
      id, 
      message, 
      onConfirm: () => {
        onConfirm();
        removeConfirmation(id);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        removeConfirmation(id);
      },
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type || 'warning'
    };
    
    setConfirmations(prev => [...prev, newConfirmation]);
    
    return id;
  };

  const removeConfirmation = (id: string) => {
    setConfirmations(prev => prev.filter(confirmation => confirmation.id !== id));
  };

  const contextValue: AlertContextType = {
    showAlert,
    removeAlert,
    removeAllAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    removeConfirmation
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {/* Render all alerts */}
      {alerts.map((alert) => (
        <AnimatedAlert
          key={alert.id}
          message={alert.message}
          isVisible={true}
          onClose={() => removeAlert(alert.id)}
          options={alert.options}
        />
      ))}

      {/* Render all confirmation dialogs */}
      {confirmations.map((confirmation) => (
        <ConfirmationDialog
          key={confirmation.id}
          isOpen={true}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          type={confirmation.type}
        />
      ))}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};