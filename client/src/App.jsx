import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

import AdminLayout from './layouts/AdminLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminPlanDetail from './pages/admin/AdminPlanDetail';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminExercises from './pages/admin/AdminExercises';
import AdminChat from './pages/admin/AdminChat';
import AdminScoreBoxes from './pages/admin/AdminScoreBoxes';
import AdminWall from './pages/admin/AdminWall';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPayments from './pages/admin/AdminPayments'

import ClientLayout from './pages/client/ClientLayout';
import ClientHome from './pages/client/ClientHome';
import ClientWorkouts from './pages/client/ClientWorkouts';
import ClientChat from './pages/client/ClientChat';
import ClientWall from './pages/client/ClientWall';
import ClientProfile from './pages/client/ClientProfile';
import ClientStore from './pages/client/ClientStore';

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
        
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="plans/:id" element={<AdminPlanDetail />} />
            <Route path="scoreboxes" element={<AdminScoreBoxes />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="wall" element={<AdminWall />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="exercises" element={<AdminExercises />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>

          <Route path="/app" element={<ClientLayout />}>
        {/* Redirección: Si entra a /app, lo mandamos a /app/home */}
        <Route index element={<Navigate to="home" replace />} />
        
        {/* 1. Inicio */}
        <Route path="home" element={<ClientHome />} />
        
        {/* 2. Rutinas (Placeholder por ahora para que no de error) */}
        <Route path="workouts" element={<ClientWorkouts />} />

        {/* 3. Muro Social */}
        <Route path="wall" element={<ClientWall />} />
        
        {/* 3. Chat (Placeholder) */}
        <Route path="chat" element={<ClientChat />} />
        
        {/* 4. Perfil (Placeholder) */}
        <Route path="profile" element={<ClientProfile />} />

        {/* 5. Tienda */}
        <Route path="store" element={<ClientStore />} />
      </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;