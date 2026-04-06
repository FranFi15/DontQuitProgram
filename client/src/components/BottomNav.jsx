import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom'; // 👈 Importante
import axios from '../api/axios';
import { Home, Calendar, MessageCircle, User, MessageSquare, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import './BottomNav.css';

function BottomNav() {
  const { user } = useAuth(); 
  const location = useLocation(); // 👈 Hook para detectar la URL actual
  const [badges, setBadges] = useState({ chat: 0, wall: 0 });

  const hasChatAccess = user?.subscription?.plan?.hasFollowUp;

  const fetchBadges = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`/chat/badges/${user.id}`); 
      
      // Bloqueamos el badge si ya estamos en la ruta para que no "vuelva" 
      // a aparecer por un delay del servidor mientras navegamos.
      setBadges({
        chat: location.pathname.includes('/app/chat') ? 0 : (res.data.unreadChat || 0),
        wall: location.pathname.includes('/app/wall') ? 0 : (res.data.unreadWall || 0)
      });
    } catch (error) {
      console.error("Error badges", error);
    }
  };

  // 👇 LIMPIEZA INSTANTÁNEA: Si el usuario cambia a Muro o Chat, borramos el punto rojo localmente
  useEffect(() => {
    if (location.pathname === '/app/wall') {
      setBadges(prev => ({ ...prev, wall: 0 }));
    }
    if (location.pathname === '/app/chat') {
      setBadges(prev => ({ ...prev, chat: 0 }));
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 20000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]); 

  const handleLockedClick = (e) => {
    e.preventDefault();
    alert("Tu plan actual no incluye seguimiento 1 a 1.");
  };

  return (
    <nav className="bottom-nav">
      <NavLink to="/app/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <Home size={24} />
        <span>Inicio</span>
      </NavLink>
      
      <NavLink to="/app/workouts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <Calendar size={24} />
        <span>Rutina</span>
      </NavLink>

      <NavLink to="/app/wall" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <div className="nav-icon-wrapper">
          <MessageSquare size={24} />
          {badges.wall > 0 && <span className="nav-badge-dot" />}
        </div>
        <span>Muro</span>
      </NavLink>
      
      {hasChatAccess ? (
        <NavLink to="/app/chat" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <div className="nav-icon-wrapper">
            <MessageCircle size={24} />
            {badges.chat > 0 && <span className="nav-badge-dot" />}
          </div>
          <span>Chat</span>
        </NavLink>
      ) : (
        <div className="nav-item locked" onClick={handleLockedClick}>
          <Lock size={24} />
          <span>Chat</span>
        </div>
      )}
      
      <NavLink to="/app/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <User size={24} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;