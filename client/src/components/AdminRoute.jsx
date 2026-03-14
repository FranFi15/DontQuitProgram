import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

function AdminRoute() {
  const { user, isAuthenticated } = useAuth();

  // 1. Si ni siquiera inició sesión, lo mandamos al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si inició sesión, pero su rol NO es ADMIN, lo mandamos a la vista de atletas
  if (user?.role !== 'ADMIN') {
    // Acá poné la ruta a donde querés mandarlo. Por ejemplo "/" o "/client/wall"
    return <Navigate to="/" replace />; 
  }

  // 3. Si pasó los dos filtros de arriba, ¡es Ro! Le mostramos la pantalla que pidió.
  return <Outlet />;
}

export default AdminRoute;