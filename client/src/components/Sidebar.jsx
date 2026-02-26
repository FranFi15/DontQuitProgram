// client/src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  Library, 
  LogOut,
  DollarSign,
  MessageSquare
} from 'lucide-react';

function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <img className="brand-logo" src="/src/assets/logob.png" alt="logo" />
        <p className="user-name">Hola, {user?.name}</p>
      </div>

      {/* Links de Navegación */}
      <nav className="sidebar-nav">
        
        <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Panel Principal</span>
        </Link>

        <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
          <Users size={20} />
          <span>Alumnos</span>
        </Link>

        <Link to="/admin/plans" className={`nav-item ${isActive('/admin/plans') ? 'active' : ''}`}>
          <Dumbbell size={20} />
          <span>Planes</span>
        </Link>

        <Link to="/admin/subscriptions" className={`nav-item ${isActive('/admin/subscriptions') ? 'active' : ''}`}>
          <DollarSign size={20} />
          <span>Suscripciones</span>
        </Link>

        <Link to="/admin/chat" className={`nav-item ${isActive('/admin/chat') ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Chats</span>
        </Link>

        <Link to="/admin/exercises" className={`nav-item ${isActive('/admin/exercises') ? 'active' : ''}`}>
          <Library size={20} />
          <span>Glosario Videos</span>
        </Link>

      </nav>

      {/* Botón de Salir */}
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;