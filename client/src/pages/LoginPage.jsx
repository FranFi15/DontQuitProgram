// client/src/pages/LoginPage.jsx
import { useForm } from 'react-hook-form';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import './LoginPage.css'; 
import logo from '../assets/logob.png';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  const onSubmit = async (values) => {
    try {
      const res = await axios.post('/auth/login', values);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/app');
      }
    } catch (error) {
      console.error(error);
      setLoginError(error.response?.data?.error || "Error al iniciar sesión");
    }
  };

  return (
  <div className="login-container">
    <div className="login-box">
      {/* 1. El Título aparece primero */}
      <h1 className="login-title animate-enter">INICIAR SESIÓN</h1>
      
      {loginError && (
        <div className="error-message animate-enter delay-100">
          {loginError}
        </div>
      )}

      {/* 2. El Formulario aparece segundo */}
      <form onSubmit={handleSubmit(onSubmit)} className="login-form animate-enter delay-200">
        
        <div className="form-group">
          <label className="login-label-text">Email</label>
          <input 
            type="email" 
            {...register("email", { required: true })}
            className="login-input"
          />
          {errors.email && <span className="input-error">Email requerido</span>}
        </div>

        <div className="form-group">
          <label className="login-label-text">Contraseña</label>
          <input 
            type="password" 
            {...register("password", { required: true })}
            className="login-input"
          />
          {errors.password && <span className="input-error">Contraseña requerida</span>}
        </div>

        <button type="submit" className="login-button">
          ENTRAR
        </button>
      </form>

      {/* 3. Los links y el footer aparecen al final */}
      <div className="register-link-container animate-enter delay-300">
        <p>
          ¿NO TIENES CUENTA? <Link to="/register" className="register-link">REGÍSTRATE</Link>
        </p>
      </div>
      <div className="footer-logo animate-enter delay-300">
        <img src={logo} alt="logo" />
      </div>
    </div>
  </div>
);
}

export default LoginPage;