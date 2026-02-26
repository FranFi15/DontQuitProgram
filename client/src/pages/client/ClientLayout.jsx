// src/pages/client/ClientLayout.jsx
import { Outlet } from 'react-router-dom';
import BottomNav from '../../components/BottomNav'
import './ClientLayout.css'; 

function ClientLayout() {
  return (
    <div className="client-layout">
        
      
      {/* Contenedor del contenido (Home, Wall, etc) */}
      <main className="client-main-content">
        <Outlet />
      </main>
      {/* Barra de navegación inferior */}
      <BottomNav />
    </div>
  );
}

export default ClientLayout;