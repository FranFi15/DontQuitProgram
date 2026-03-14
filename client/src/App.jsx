import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

// 👇 1. IMPORTAMOS LOS PATOVICAS
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/public/LoginPage';
import ResetPassword from './pages/public/ResetPassword';

import LandingPage from './pages/public/LandingPage';
import CheckoutPage from './pages/public/CheckoutPage';

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
      <AlertProvider>
      <BrowserRouter>
        <Routes>
          {/* 🟢 RUTAS 100% PÚBLICAS */}
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/:planId" element={<CheckoutPage />} />
          
        
          {/* 🔴 RUTAS DE ADMIN (SOLO PARA RO) */}
          <Route element={<AdminRoute />}>
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
          </Route>

          {/* 🔵 RUTAS DE ATLETAS (SOLO LOGUEADOS) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<ClientLayout />}>
              {/* Redirección: Si entra a /app, lo mandamos a /app/home */}
              <Route index element={<Navigate to="home" replace />} />
              
              <Route path="home" element={<ClientHome />} />
              <Route path="workouts" element={<ClientWorkouts />} />
              <Route path="wall" element={<ClientWall />} />
              <Route path="chat" element={<ClientChat />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="store" element={<ClientStore />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;