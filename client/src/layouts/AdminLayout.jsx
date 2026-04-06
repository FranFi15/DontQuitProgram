import { useState, useEffect, useRef } from 'react'; // 👈 Agregamos useRef
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Users, Dumbbell, Calendar, LayoutDashboard, LogOut, MessageCircle, DollarSign, ClipboardList, MessageSquare, Tag, Ticket, Menu, X } from 'lucide-react';
import './AdminLayout.css'; 

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [badges, setBadges] = useState({ payments: 0, chat: 0, wall: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  // --- 1. REFERENCIAS PARA ALERTAS ---
  const audioRef = useRef(new Audio('/assets/notification.mp3')); 
  const prevBadgesRef = useRef({ payments: 0, chat: 0, wall: 0 });

  // --- 2. FUNCIÓN PARA MOSTRAR BANNER Y SONIDO ---
  const triggerNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: '/logob.png' });
    }
    audioRef.current.play().catch(() => console.log("Audio esperando interacción"));
  };

  const fetchBadges = async () => {
    try {
      const res = await axios.get('/payments/badges'); 
      const newData = {
        payments: res.data.payments || 0,
        chat: res.data.chat || 0,
        wall: res.data.wall || 0
      };

      // --- 3. COMPARAR PARA ACTIVAR ALERTA ---
      // Si hay más mensajes que antes y Ro no está en la pantalla de chat...
      if (newData.chat > prevBadgesRef.current.chat && !location.pathname.includes('chat')) {
        triggerNotification("Nuevo Mensaje", "Un alumno te escribió al chat.");
      }
      // Si hay nuevos pagos pendientes...
      if (newData.payments > prevBadgesRef.current.payments && !location.pathname.includes('payments')) {
        triggerNotification("Nuevo Pago", "Tenés un comprobante pendiente de revisión.");
      }

      // Actualizamos la "memoria" del contador
      prevBadgesRef.current = newData;

      setBadges({
        payments: location.pathname.includes('payments') ? 0 : newData.payments,
        chat: location.pathname.includes('chat') ? 0 : newData.chat,
        wall: location.pathname.includes('wall') ? 0 : newData.wall
      });

    } catch (error) {
      console.error("Error buscando notificaciones", error);
    }
  };

  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    fetchBadges(); 
    const interval = setInterval(fetchBadges, 15000); 
    return () => clearInterval(interval); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


  const handleLogout = () => {
    navigate('/login');
  };

  // Función para hacer scroll del celular y que el contenido no quede bloqueado cuando el menú está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="admin-layout">
      
      {/* 👈 HEADER MÓVIL (Solo visible en celulares) */}
      <div className="admin-mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={28} />
        </button>
        <span className="mobile-brand">Don't Quit.</span>
      </div>

      {/* 👈 OVERLAY OSCURO PARA CERRAR EL MENÚ (Solo en celular) */}
      {isMobileMenuOpen && (
        <div 
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR FIJO IZQUIERDA (Con clase dinámica para móviles) */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logob.png" alt="logo don't quit" />
          {/* Botón X para cerrar en móvil */}
          <button className="close-sidebar-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
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