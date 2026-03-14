import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // Si no está logueado, lo mandamos a que inicie sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;