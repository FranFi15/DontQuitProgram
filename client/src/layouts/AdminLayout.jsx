import { useState, useEffect } from 'react'; 
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Users, Dumbbell, Calendar, LayoutDashboard, LogOut, MessageCircle, DollarSign, ClipboardList, MessageSquare, Tag, Ticket} from 'lucide-react';
import './AdminLayout.css'; 

function AdminLayout() {
  const navigate = useNavigate();
  
  // --- ESTADO PARA LAS NOTIFICACIONES ---
  const [badges, setBadges] = useState({ payments: 0, chat: 0, wall: 0 });

  const clearBadgeLocally = (type) => {
    setBadges(prevBadges => ({
      ...prevBadges,
      [type]: 0
    }));
  };

  // --- FUNCIÓN PARA BUSCAR NOTIFICACIONES ---
 const fetchBadges = async () => {
    try {
      const res = await axios.get('/payments/badges'); 
      // Guardamos los 3 datos que nos manda el backend
      setBadges({ 
        payments: res.data.payments || 0,
        chat: res.data.chat || 0,
        wall: res.data.wall || 0
      });
    } catch (error) {
      console.error("Error buscando notificaciones", error);
    }
  };

  // --- EFECTO: CONSULTAR CADA 15 SEGUNDOS ---
  useEffect(() => {
    fetchBadges(); // Consulta inicial al montar el componente
    const interval = setInterval(fetchBadges, 15000); // Polling cada 15s
    return () => clearInterval(interval); // Limpieza al desmontar
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      
      {/* SIDEBAR FIJO IZQUIERDA */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img className="brand-logo" src="/src/assets/logob.png" alt="logo don't quit" />
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <Users size={20} /> Alumnos
          </NavLink>

          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <Tag size={20} /> Categorías
          </NavLink>

          <NavLink to="/admin/plans" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <Calendar size={20} /> Planes
          </NavLink>

          <NavLink to="/admin/scoreboxes" className={({ isActive }) =>isActive ? "sidebar-link active" : "sidebar-link"}>
            <ClipboardList size={20} /> ScoreBox
          </NavLink>

          <NavLink to="/admin/subscriptions" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <Ticket size={20} />
            <span>Suscripciones</span>
          </NavLink>

          <NavLink to="/admin/exercises" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <Dumbbell size={20} /> Glosario
          </NavLink>

          <NavLink to="/admin/wall" onClick={() => clearBadgeLocally('wall')} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link" }>
            <div className="icon-with-badge">
              <MessageSquare size={20} />
              {badges.wall > 0 && (
                <span className="notification-bubble">{badges.wall}</span>
              )}
            </div>
            <span>Muro</span>
          </NavLink>

          <NavLink to="/admin/chat" onClick={() => clearBadgeLocally('chat')} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <div className="icon-with-badge">
              <MessageCircle size={20} />
              {badges.chat > 0 && (
                <span className="notification-bubble">{badges.chat}</span>
              )}
            </div>
            <span>Mensajes</span>
          </NavLink>
          

          <NavLink 
            to="/admin/payments" 
            onClick={() => clearBadgeLocally('payments')}
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <div className="icon-with-badge">
              <DollarSign size={20} />
              {badges.payments > 0 && (
                <span className="notification-bubble">{badges.payments}</span>
              )}
            </div>
            <span>Cobros</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO DINÁMICO DERECHA */}
      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;