import React, { createContext, useContext, useState, ReactNode } from 'react';
import AnimatedAlert, { AlertOptions } from '../components/AnimatedAlert';

interface Alert {
  id: string;
  message: string;
  options?: AlertOptions;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => string;
  removeAlert: (id: string) => void;
  removeAllAlerts: () => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

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

  const contextValue: AlertContextType = {
    showAlert,
    removeAlert,
    removeAllAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo
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