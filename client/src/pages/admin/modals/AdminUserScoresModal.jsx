import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { X, ClipboardList } from 'lucide-react';
import AdminClientScoreViewer from '../modals/AdminClientScoreViewer'; 
import './AdminUserScoresModal.css';

function AdminUserScoresModal({ userId, userName, onClose }) {
  const [history, setHistory] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar el historial de planes de este usuario
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/scoreboxes/history/${userId}`);
        setHistory(res.data);
        
        // Autoseleccionar el primero
        if (res.data.length > 0) {
          setSelectedPlanId(res.data[0].planId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  return (
    <div className="modal-overlay">
      <div className="modal-content-large animate-scale-up">
        
        {/* HEADER DEL MODAL */}
        <div className="modal-header-simple">
          <div className="header-title-box">
             <ClipboardList size={20} color='#333'/>
             <h3>Métricas de {userName}</h3>
             <button onClick={onClose} className="close-btn"><X size={20}/></button>
          </div>
        </div>

        <div className="modal-body-scroll">
          
          {loading ? (
            <p className="loading-txt">Cargando historial...</p>
          ) : history.length === 0 ? (
            <div className="empty-state-modal">
              <p>Este usuario no tiene planes con métricas registradas.</p>
            </div>
          ) : (
            <>
              {/* SELECTOR DE PLANES (TABS) */}
              <div className="admin-score-tabs">
                {history.map(plan => (
                  <button
                    key={plan.planId}
                    onClick={() => setSelectedPlanId(plan.planId)}
                    className={`as-tab-btn ${selectedPlanId === plan.planId ? 'active' : ''}`}
                  >
                    {plan.planName}
                  </button>
                ))}
              </div>

              {/* TABLA DE RESULTADOS */}
              <div className="admin-score-content">
                {selectedPlanId && (
                  <AdminClientScoreViewer 
                    key={selectedPlanId} // Force re-render al cambiar
                    planId={selectedPlanId}
                    userId={userId}
                  />
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminUserScoresModal;