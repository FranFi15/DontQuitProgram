import { useState, useEffect, useRef } from 'react'; 
import { NavLink, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Home, Calendar, MessageCircle, User, MessageSquare, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import './BottomNav.css';

function BottomNav() {
  const { user } = useAuth(); 
  const location = useLocation();
  const [badges, setBadges] = useState({ chat: 0, wall: 0 });
  
  // 👇 REFERENCIAS PARA EL SONIDO Y EL CONTEO PREVIO
  const audioRef = useRef(new Audio('/assets/notification.mp3')); // Asegurate de tener el archivo en public/assets/
  const prevBadgesRef = useRef({ chat: 0, wall: 0 });

  const hasChatAccess = user?.subscription?.plan?.hasFollowUp;

  // 1. SOLICITAR PERMISO AL INICIO
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const showWebNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: '/logob.png' // Tu logo
      });
    }
    // Reproducir sonido siempre que la pestaña esté abierta
    audioRef.current.play().catch(err => console.log("Audio bloqueado por el navegador hasta que el usuario interactúe"));
  };

  const fetchBadges = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`/chat/badges/${user.id}`); 
      const newChatCount = res.data.unreadChat || 0;
      const newWallCount = res.data.unreadWall || 0;

      // 2. COMPARAR SI HAY ALGO NUEVO (Si el número subió)
      if (location.pathname !== '/app/chat' && newChatCount > prevBadgesRef.current.chat) {
        showWebNotification("Nuevo mensaje", "Ro te envió un mensaje al chat.");
      }
      if (location.pathname !== '/app/wall' && newWallCount > prevBadgesRef.current.wall) {
        showWebNotification("Nuevo mensaje en el Muro.");
      }

      // Actualizamos la referencia del conteo previo
      prevBadgesRef.current = { chat: newChatCount, wall: newWallCount };

      setBadges({
        chat: location.pathname.includes('chat') ? 0 : newChatCount,
        wall: location.pathname.includes('wall') ? 0 : newWallCount
      });
    } catch (error) {
      console.error("Error badges", error);
    }
  };

  useEffect(() => {
    if (location.pathname === '/app/wall') setBadges(prev => ({ ...prev, wall: 0 }));
    if (location.pathname === '/app/chat') setBadges(prev => ({ ...prev, chat: 0 }));
  }, [location.pathname]);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 20000);
    return () => clearInterval(interval);
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