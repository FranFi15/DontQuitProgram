import { useForm } from 'react-hook-form';
import axios from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css'; 
import logo from '../assets/logob.png';

function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      // Enviamos todos los datos (name, email, pass, phone, birthDate, sex)
      await axios.post('/auth/register', values);
      alert("¡Usuario creado con éxito! Ahora puedes loguearte.");
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Error al registrarse");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title animate-enter">CREAR CUENTA</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="register-form animate-enter delay-100">
          
          {/* Nombre */}
          <div className="form-group">
            <label className="register-label">Nombre Completo</label>
            <input 
              type="text" 
              {...register("name", { required: true })}
              className="register-input"
              placeholder="Ej: Juan Pérez"
            />
            {errors.name && <span className="input-error">Nombre requerido</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="register-label">Email</label>
            <input 
              type="email" 
              {...register("email", { required: true })}
              className="register-input"
              placeholder="ejemplo@email.com"
            />
            {errors.email && <span className="input-error">Email requerido</span>}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="register-label">Contraseña</label>
            <input 
              type="password" 
              {...register("password", { required: true, minLength: 6 })}
              className="register-input"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <span className="input-error">Mínimo 6 caracteres</span>}
          </div>

          {/* --- NUEVOS CAMPOS --- */}

          {/* Teléfono */}
          <div className="form-group">
            <label className="register-label">Teléfono</label>
            <input 
              type="tel" 
              {...register("phone")}
              className="register-input"
              placeholder="Ej: 11 1234 5678"
            />
          </div>

          {/* Fecha de Nacimiento y Sexo en una fila (opcional, o uno abajo del otro) */}
          <div className="form-group">
            <label className="register-label">Fecha de Nacimiento</label>
            <input 
              type="date" 
              {...register("birthDate", { required: true })}
              className="register-input"
            />
            {errors.birthDate && <span className="input-error">Fecha requerida</span>}
          </div>

          <div className="form-group">
            <label className="register-label">Sexo</label>
            <select 
              {...register("sex", { required: true })}
              className="register-input select-input" // Agregué clase extra por si acaso
            >
              <option value="">Seleccionar...</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.sex && <span className="input-error">Requerido para personalizar tu perfil</span>}
          </div>

          <button type="submit" className="register-button">
            REGISTRARSE
          </button>
        </form>

        <div className="login-link-container animate-enter delay-200">
          <p>
            ¿YA TIENES CUENTA? <Link to="/login" className="login-link">INICIA SESIÓN</Link>
          </p>
        </div>
        
        <div className="footer-logo animate-enter delay-300">
          <img src={logo} alt="logo" />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;