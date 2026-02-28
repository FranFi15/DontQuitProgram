import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './AlertContext.css';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  // type puede ser: 'success', 'error', o 'info'
  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
    
    // La alerta se cierra sola después de 4 segundos
    setTimeout(() => {
      setAlert(null);
    }, 4000); 
  }, []);

  const closeAlert = () => setAlert(null);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {/* El diseño visual de la alerta que se superpone a todo */}
      {alert && (
        <div className={`custom-toast-container ${alert.type}`}>
          <div className="custom-toast-content">
            {alert.type === 'success' && <CheckCircle size={20} className="toast-icon-success" />}
            {alert.type === 'error' && <AlertCircle size={20} className="toast-icon-error" />}
            {alert.type === 'info' && <Info size={20} className="toast-icon-info" />}
            <p>{alert.message}</p>
          </div>
          <button onClick={closeAlert} className="custom-toast-close">
            <X size={18} />
          </button>
        </div>
      )}
    </AlertContext.Provider>
  );
};