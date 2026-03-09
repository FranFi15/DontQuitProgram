// client/src/pages/public/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext';
import { Lock, CheckCircle2 } from 'lucide-react';
import './LoginPage.css'; // Usamos los mismos estilos base del login
import logo from '../../../public/logob.png';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); 
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showAlert("Las contraseñas no coinciden.", "error");
    }
    if (passwords.newPassword.length < 6) {
      return showAlert("La contraseña debe tener al menos 6 caracteres.", "error");
    }

    setLoading(true);
    try {
      await axios.post('/auth/reset-password', {
        token,
        newPassword: passwords.newPassword
      });
      setSuccess(true);
      showAlert("Contraseña actualizada con éxito.", "success");
    } catch (error) {
      showAlert(error.response?.data?.error || "Error al restablecer la contraseña.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Si alguien entra a la página sin el token de la URL, le mostramos este error
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box" style={{ textAlign: 'center' }}>
          <h2 style={{color: '#111'}}>Enlace inválido</h2>
          <p style={{color: '#6b7280', margin: '20px 0'}}>No se encontró el token de seguridad. Por favor, solicitá un nuevo enlace desde la página de inicio de sesión.</p>
          <Link to="/login" className="login-button" style={{textDecoration: 'none', display: 'inline-block'}}>
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">

        <h1 className="login-title animate-enter" style={{fontSize: '1.5rem'}}>CREAR NUEVA CONTRASEÑA</h1>
        
        {success ? (
          <div className="animate-enter delay-200" style={{ textAlign: 'center', marginTop: '20px' }}>
            <CheckCircle2 size={60} color="#10b981" style={{ margin: '0 auto 20px' }} />
            <p style={{ color: '#4b5563', marginBottom: '30px', lineHeight: '1.5' }}>
              Tu contraseña ha sido modificada correctamente. Ya podés ingresar a tu cuenta de forma segura.
            </p>
            <button className="login-button" onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form animate-enter delay-200" style={{marginTop: '30px'}}>
            
            <div className="form-group">
              <label className="login-label-text">Nueva Contraseña</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af'}} />
                <input 
                  type="password" 
                  className="login-input"
                  style={{paddingLeft: '45px'}}
                  placeholder="Mínimo 6 caracteres"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="login-label-text">Repetir Contraseña</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af'}} />
                <input 
                  type="password" 
                  className="login-input"
                  style={{paddingLeft: '45px'}}
                  placeholder="Repetir contraseña"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading} style={{marginTop: '20px'}}>
              {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
            </button>
          </form>
        )}
        <div className="footer-logo animate-enter" style={{marginBottom: '20px'}}>
          <img src={logo} alt="Don't Quit Logo" />
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;