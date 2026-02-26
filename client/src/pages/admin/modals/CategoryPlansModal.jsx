// client/src/pages/admin/modals/CategoryPlansModal.jsx
import { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategoryPlansModal.css';

function CategoryPlansModal({ category, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (category) {
      fetchPlansForCategory();
    }
  }, [category]);

  const fetchPlansForCategory = async () => {
    try {
      // Necesitaremos una ruta en el backend para buscar planes por categoría,
      // pero podemos aprovechar la ruta getAllPlans y filtrarlos en el front para simplificar.
      const res = await axios.get('/plans');
      // Filtramos solo los planes que pertenecen a esta categoría
      const categoryPlans = res.data.filter(p => p.planTypeId === category.id);
      setPlans(categoryPlans);
    } catch (error) {
      console.error("Error al cargar los planes de la categoría", error);
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
                    onClick={() => navigate(`/admin/plans/${plan.id}`)}
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