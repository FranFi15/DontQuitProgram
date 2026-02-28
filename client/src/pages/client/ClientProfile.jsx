import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import { createPortal } from 'react-dom';
import { User, Calendar, Phone, Save, LogOut, Lock, X, ShoppingBag } from 'lucide-react';
import './ClientProfile.css';
import { useNavigate } from 'react-router-dom';

function ClientProfile() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    sex: '',
    birthDate: ''
  });
  const [loading, setLoading] = useState(false);
  
  // --- NUEVO: Estado para saber si es Activo ---
  const [isSubActive, setIsSubActive] = useState(false);
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  // Cargar datos básicos
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        sex: user.sex || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
      checkSubscriptionStatus(); // Llamamos a la verificación
    }
  }, [user]);

  // --- NUEVO: Función que verifica si tiene planes activos ---
  const checkSubscriptionStatus = async () => {
    try {
      // Usamos la misma ruta que usás en el Muro para ver sus planes
      const res = await axios.get(`/workouts/my-plans/${user.id}`);
      // Si el array trae algo, significa que tiene al menos un plan activo hoy
      if (res.data && res.data.length > 0) {
        setIsSubActive(true);
      } else {
        setIsSubActive(false);
      }
    } catch (error) {
      console.error("Error verificando suscripción:", error);
      setIsSubActive(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/users/profile/${user.id}`, formData);
      alert("✅ Perfil actualizado correctamente");
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Las contraseñas nuevas no coinciden");
    if (passData.new.length < 6) return alert("La nueva contraseña debe tener al menos 6 caracteres");

    setPassLoading(true);
    try {
      await axios.put(`/users/profile/password/${user.id}`, {
        currentPassword: passData.current,
        newPassword: passData.new
      });
      alert("✅ ¡Contraseña cambiada exitosamente!");
      setShowPassModal(false);
      setPassData({ current: '', new: '', confirm: '' });
    } catch (error) {
      alert(error.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setPassLoading(false);
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassModal(true);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="profile-page">
      
      <div className="profile-header">
        <h1 className="profile-title">Mi Perfil</h1>
      </div>

      <div className="profile-scroll-content">
        
        {/* TARJETA DE IDENTIDAD */}
        <div className="profile-card identity-card">
          <div className="avatar-large">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="user-fullname">{user.name}</h2>
          <p className="user-email">{user.email}</p>
          
          {/* 👇 BADGE AHORA ES DINÁMICO 👇 */}
          <div className={`status-badge-profile ${isSubActive ? 'active' : 'inactive'}`}>
            {isSubActive ? 'Suscripción Activa' : 'Sin Suscripción'}
          </div>
          
          <button 
            onClick={() => navigate('/app/store')} 
            className="store-quick-btn"
          >
            <ShoppingBag size={14} /> Tienda
          </button>
        </div>

        {/* FORMULARIO DE DATOS */}
        <form onSubmit={handleSubmit} className="profile-form">
          <h3 className="section-label">Datos Personales</h3>
          
          <div className="form-group">
            <label><User size={16}/> Nombre Completo</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="profile-input" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Phone size={16}/> Teléfono</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="profile-input" placeholder="+54 ..." />
            </div>
            
            <div className="form-group">
              <label><User size={16}/> Sexo</label>
              <select name="sex" value={formData.sex} onChange={handleChange} className="profile-input">
                <option value="">Elegir...</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><Calendar size={16}/> Fecha de Nacimiento</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="profile-input" />
          </div>

          <button type="submit" className="save-profile-btn" disabled={loading}>
            {loading ? 'Guardando...' : (
              <> <Save size={18}/> Guardar Cambios </>
            )}
          </button>
        </form>

        {/* SEGURIDAD */}
        <div className="security-section">
          <h3 className="section-label">Seguridad</h3>
          <button type="button" className="change-pass-btn" onClick={handleOpenModal}>
            <Lock size={18} /> Cambiar Contraseña
          </button>
        </div>

        {/* LOGOUT */}
        <div className="logout-section">
          <button type="button" onClick={handleLogout} className="logout-btn">
            <LogOut size={18}/> Cerrar Sesión
          </button>
          <p className="app-version">Don't Quit App v1.0</p>
        </div>

      </div>

      {/* --- MODAL --- */}
      {showPassModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowPassModal(false)}>
          <div className="modal-content-pass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pass">
              <h3>Cambiar Contraseña</h3>
              <button type="button" onClick={() => setShowPassModal(false)} className="close-icon-btn"><X size={20}/></button>
            </div>
            <form onSubmit={handleChangePass} className="pass-form">
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="profile-input" required />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="profile-input" required placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label>Repetir Nueva</label>
                <input type="password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="profile-input" required />
              </div>
              <div className="modal-footer-pass">
                <button type="button" onClick={() => setShowPassModal(false)} className="cancel-pass-btn">Cancelar</button>
                <button type="submit" className="save-pass-btn" disabled={passLoading}>{passLoading ? '...' : 'Actualizar'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body 
      )}
    </div>
  );
}

export default ClientProfile;