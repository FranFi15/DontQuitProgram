import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { Users, CreditCard, Dumbbell, AlertTriangle, TrendingUp, Calendar, DollarSign, ChevronRight, Activity, Wallet } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
        // 👈 3. AGREGAMOS LA ALERTA DE ERROR
        showAlert("Error al cargar las estadísticas del panel.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showAlert]);

  // Formateadores de moneda
  const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>Sincronizando métricas...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Panel de Control</h1>
          <p className="dashboard-subtitle">Hola Coach!</p>
        </div>
        <div className="date-badge">
          <Calendar size={16} /> 
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="stats-grid">
        
        {/* INGRESOS EN PESOS */}
        <div className="stat-card premium-card" onClick={() => navigate('/admin/payments')}>
          <div className="stat-icon revenue-ars"><DollarSign size={28} /></div>
          <div className="stat-info">
            <p>Ingresos  (ARS)</p>
            <h3>{formatARS(stats?.monthlyRevenueARS || 0)}</h3>
          </div>
          {stats?.pendingPayments > 0 && (
            <div className="stat-notification-badge">
              {stats.pendingPayments} pendientes
            </div>
          )}
        </div>

        {/* INGRESOS EN DÓLARES (NUEVA) */}
        <div className="stat-card intl-card" onClick={() => navigate('/admin/payments')}>
          <div className="stat-icon revenue-usd"><Wallet size={24} /></div>
          <div className="stat-info">
            <p>Ingresos  (USD)</p>
            <h3>{formatUSD(stats?.monthlyRevenueUSD || 0)}</h3>
          </div>
          <div className="stat-trend positive">
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/subscriptions')}>
          <div className="stat-icon active-users"><Activity size={24} /></div>
          <div className="stat-info">
            <p>Atletas Activos</p>
            <h3>{stats?.activeAthletes || 0}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users')}>
          <div className="stat-icon users"><Users size={24} /></div>
          <div className="stat-info">
            <p>Comunidad Total</p>
            <h3>{stats?.totalUsers || 0}</h3>
          </div>
        </div>

      </div>

      <div className="dashboard-content">
        
        {/* COLUMNA IZQUIERDA: ALERTAS DE VENCIMIENTO */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><AlertTriangle size={20} className="text-warning"/> Próximos Vencimientos</h2>
            <button className="view-all-btn" onClick={() => navigate('/admin/subscriptions')}>
              Gestionar <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="expiring-list">
            {!stats?.expiringSoon || stats.expiringSoon.length === 0 ? (
              <div className="empty-state-box">
                <p>No hay planes por vencer esta semana. ¡Buen trabajo!</p>
              </div>
            ) : (
              stats.expiringSoon.map((sub, index) => {
                const daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 2;

                return (
                  <div key={index} className="expiring-item">
                    <div className="expiring-avatar">
                      {sub.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="expiring-info">
                      <span className="fw-bold">{sub.user.name}</span>
                      <span className="plan-name">{sub.plan.title}</span>
                    </div>
                    <div className={`expiring-badge ${isUrgent ? 'urgent' : ''}`}>
                      {daysLeft === 0 ? '¡Vence Hoy!' : `En ${daysLeft} días`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: ACCIONES RÁPIDAS */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Acciones de Gestión</h2>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-card" onClick={() => navigate('/admin/users')}>
              <div className="qa-icon"><Users size={24}/></div>
              <span>Nuevo Alumno</span>
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/plans')}>
              <div className="qa-icon"><Calendar size={24}/></div>
              <span>Planes</span>
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/payments')}>
              <div className="qa-icon"><CreditCard size={24}/></div>
              <span>Cobros</span>
              {stats?.pendingPayments > 0 && <span className="qa-badge">{stats.pendingPayments}</span>}
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/exercises')}>
              <div className="qa-icon"><Dumbbell size={24}/></div>
              <span>Ejercicios</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;