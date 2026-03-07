import { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { X, History } from 'lucide-react';
import './CreateUserModal.css'; 

function UserSubscriptionsModal({ userId, userName, onClose }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/users/${userId}/subscriptions`);
        setSubscriptions(res.data);
      } catch (error) {
        console.error("Error al cargar historial", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  const isSubscriptionActive = (sub) => {
    if (!sub.isActive) return false;
    if (!sub.endDate) return true; 
    return new Date(sub.endDate) > new Date();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter" style={{ maxWidth: '700px' }}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <History size={24} color="#111" />
             <h2>Historial de {userName}</h2>
          </div>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando historial...</p>
          ) : subscriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
              Este alumno aún no tiene suscripciones registradas.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '0.9rem' }}>
                  <th style={{ padding: '12px 8px' }}>Plan</th>
                  <th style={{ padding: '12px 8px' }}>Inicio</th>
                  <th style={{ padding: '12px 8px' }}>Vencimiento</th>
                  <th style={{ padding: '12px 8px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const active = isSubscriptionActive(sub);
                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.95rem' }}>
                      <td style={{ padding: '15px 8px', fontWeight: '600', color: '#111' }}>
                        {sub.plan?.title || 'Plan Eliminado'}
                      </td>
                      <td style={{ padding: '15px 8px', color: '#4b5563' }}>
                        {new Date(sub.startDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '15px 8px', color: '#4b5563' }}>
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Sin Límite'}
                      </td>
                      <td style={{ padding: '15px 8px' }}>
                        {active ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                            ACTIVO
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                            VENCIDO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '15px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="cancel-btn">Cerrar</button>
        </div>

      </div>
    </div>
  );
}

export default UserSubscriptionsModal;