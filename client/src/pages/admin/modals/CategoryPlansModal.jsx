// client/src/pages/admin/modals/CategoryPlansModal.jsx
import { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategoryPlansModal.css';

function CategoryPlansModal({ category, onClose }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (category) {
      fetchPlansForCategory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const fetchPlansForCategory = async () => {
    try {
      const res = await axios.get('/plans');
      // Filtramos solo los planes que pertenecen a esta categoría
      const categoryPlans = res.data.filter(p => p.planTypeId === category.id);
      setPlans(categoryPlans);
    } catch (error) {
      console.error("Error al cargar los planes de la categoría", error);
      // 👈 3. ALERTA SI FALLA LA CARGA
      showAlert("Error al cargar los planes de esta categoría.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cat-modal-overlay" onClick={onClose}>
      <div className="cat-modal-content animate-enter" onClick={(e) => e.stopPropagation()}>
        
        <div className="cat-modal-header">
          <div>
            <span className="cat-badge">PLANES EN CATEGORÍA</span>
            <h2>{category.name}</h2>
          </div>
          <button onClick={onClose} className="cat-close-btn"><X size={24}/></button>
        </div>

        <div className="cat-modal-body">
          {loading ? (
            <div className="cat-loading">Cargando planes...</div>
          ) : plans.length === 0 ? (
            <div className="cat-empty">Esta categoría aún no tiene planes asignados.</div>
          ) : (
            <div className="cat-plans-list">
              {plans.map(plan => (
                <div key={plan.id} className="cat-plan-item">
                  <div className="cat-plan-info">
                    <span className="cat-plan-title">{plan.title}</span>
                    <span className={`cat-plan-status ${plan.isActive ? 'active' : 'paused'}`}>
                      {plan.isActive ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </div>
                  <button 
                    className="cat-btn-link"
                    onClick={() => {
                        onClose(); // Cerramos el modal antes de navegar
                        navigate(`/admin/plans/${plan.id}`);
                    }}
                    title="Ver Rutina del Plan"
                  >
                    <ExternalLink size={16} /> Ver Rutina
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryPlansModal;