import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Users, CreditCard, Dumbbell, AlertTriangle, TrendingUp, Calendar, DollarSign, ChevronRight, Activity } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Formateador de moneda (ARS)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>Cargando métricas...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Resumen de Actividad</h1>
          <p className="dashboard-subtitle">Hola Coach, así vienen los números de tu equipo hoy.</p>
        </div>
        <div className="date-badge">
          <Calendar size={16} /> 
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS (Ahora son 4) */}
      <div className="stats-grid">
        
        {/* Tarjeta de Ingresos (NUEVA) */}
        <div className="stat-card premium-card" onClick={() => navigate('/admin/payments')}>
          <div className="stat-icon revenue"><DollarSign size={28} /></div>
          <div className="stat-info">
            <p>Ingresos del Mes</p>
            <h3>{formatCurrency(stats?.monthlyRevenue || 0)}</h3>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> +12%
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/subscriptions')}>
          <div className="stat-icon active-users"><Activity size={24} /></div>
          <div className="stat-info">
            <p>Suscripciones Activas</p>
            <h3>{stats?.activeAthletes || 0}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users')}>
          <div className="stat-icon users"><Users size={24} /></div>
          <div className="stat-info">
            <p>Alumnos Registrados</p>
            <h3>{stats?.totalUsers || 0}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/exercises')}>
          <div className="stat-icon gym"><Dumbbell size={24} /></div>
          <div className="stat-info">
            <p>Ejercicios (Glosario)</p>
            <h3>{stats?.exercisesCount || 0}</h3>
          </div>
        </div>

      </div>

      <div className="dashboard-content">
        
        {/* COLUMNA IZQUIERDA: ALERTAS DE VENCIMIENTO */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><AlertTriangle size={20} className="text-warning"/> Próximos Vencimientos</h2>
            <button className="view-all-btn" onClick={() => navigate('/admin/subscriptions')}>
              Ver todos <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="expiring-list">
            {!stats?.expiringSoon || stats.expiringSoon.length === 0 ? (
              <div className="empty-state-box">
                <p>Todo tranquilo. Ningún plan vence en los próximos 7 días.</p>
              </div>
            ) : (
              stats.expiringSoon.map((sub, index) => {
                // Calculamos cuántos días faltan para darle color rojo si es inminente
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

        {/* COLUMNA DERECHA: ACCESOS RÁPIDOS */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Acciones Rápidas</h2>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-card" onClick={() => navigate('/admin/users')}>
              <div className="qa-icon"><Users size={24}/></div>
              <span>Nuevo Alumno</span>
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/plans')}>
              <div className="qa-icon"><Calendar size={24}/></div>
              <span>Crear Plan</span>
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/payments')}>
              <div className="qa-icon"><CreditCard size={24}/></div>
              <span>Ver Cobros</span>
            </button>
            <button className="quick-action-card" onClick={() => navigate('/admin/exercises')}>
              <div className="qa-icon"><Dumbbell size={24}/></div>
              <span>Subir Video</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;