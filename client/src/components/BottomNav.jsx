import { NavLink } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User, MessageSquare, BookOpen, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import './BottomNav.css';

function BottomNav() {
  const { user } = useAuth(); 

  // Leemos si la suscripción activa del usuario incluye seguimiento
  const hasChatAccess = user?.subscription?.plan?.hasFollowUp;

  const handleLockedClick = (e) => {
    e.preventDefault();
    alert("Tu plan actual no incluye seguimiento 1 a 1. ");
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
        <MessageSquare size={24} />
        <span>Muro</span>
      </NavLink>
      
      {/* LÓGICA DE BLOQUEO DEL CHAT */}
      {hasChatAccess ? (
        <NavLink to="/app/chat" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MessageCircle size={24} />
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