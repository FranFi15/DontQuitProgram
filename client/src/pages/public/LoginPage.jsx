// client/src/pages/LoginPage.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; 
import './LoginPage.css'; 
import logo from '../../../public/logob.png';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const { showAlert } = useAlert(); 
  const navigate = useNavigate();
  
  // Leemos los parámetros de la URL (?token=...)
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 🎯 CAPTURADOR DE PAYPAL ---
  useEffect(() => {
    const paypalToken = searchParams.get('token'); 
    
    if (paypalToken) {
      const capturePayPalPayment = async () => {
        try {
          // Recuperamos los datos guardados en el Checkout
          const userId = localStorage.getItem('pendingPayPalUserId');
          const planId = localStorage.getItem('pendingPayPalPlanId');

          if (userId && planId) {
            // Llamamos a la ruta de tu backend para capturar la orden
            // NOTA: Ajustá la ruta si tu prefijo de pagos es distinto a /payments
            await axios.post('/payments/paypal/capture-order', { 
              orderID: paypalToken, 
              userId: Number(userId), 
              planId: Number(planId) 
            });

            // Limpiamos los datos temporales
            localStorage.removeItem('pendingPayPalUserId');
            localStorage.removeItem('pendingPayPalPlanId');

            // Limpiamos la URL (quitamos el token)
            setSearchParams({});
            
            showAlert('¡Pago de PayPal exitoso! Tu cuenta ya está activa. Iniciá sesión ahora.', 'success');
          }
        } catch (error) {
          console.error("Error capturando PayPal:", error);
          showAlert('No pudimos procesar la captura de PayPal. Si te cobraron, contactá a soporte.', 'error');
          setSearchParams({});
        }
      };

      capturePayPalPayment();
    }
  }, [searchParams, setSearchParams, showAlert]);

  const onSubmit = async (values) => {
    try {
      const res = await axios.post('/auth/login', values);
      login(res.data.user, res.data.token);
      
      showAlert(`¡Bienvenido de vuelta, ${res.data.user.name?.split(' ')[0] || 'Atleta'}!`, "success");

      if (res.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/app');
      }
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.error || "Error al iniciar sesión. Verifica tus datos.", "error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        
        {/* BOTÓN VOLVER AL INICIO */}
        <div className="login-back-wrapper animate-enter">
          <Link to="/" className="login-back-link">
            <ArrowLeft size={18} /> Volver al inicio
          </Link>
        </div>

        <h1 className="login-title animate-enter">INICIAR SESIÓN</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form animate-enter delay-200">
          
          <div className="form-group">
            <label className="login-label-text">Email</label>
            <input 
              type="email" 
              {...register("email", { required: true })}
              className="login-input"
              placeholder="tu@email.com"
            />
            {errors.email && <span className="input-error">Email requerido</span>}
          </div>

          <div className="form-group">
            <label className="login-label-text">Contraseña</label>
            <input 
              type="password" 
              {...register("password", { required: true })}
              className="login-input"
              placeholder="••••••••"
            />
            {errors.password && <span className="input-error">Contraseña requerida</span>}
          </div>

          <button type="submit" className="login-button">
            ENTRAR
          </button>
        </form>

        <div className="register-link-container animate-enter delay-300">
          <p>
            ¿NO TIENES CUENTA? <Link to="/register" className="register-link">REGÍSTRATE</Link>
          </p>
        </div>
        
        <div className="footer-logo animate-enter delay-300">
          <img src={logo} alt="Don't Quit Logo" />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;