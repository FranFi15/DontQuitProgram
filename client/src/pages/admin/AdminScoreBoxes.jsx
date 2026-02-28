import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { ChevronRight, ClipboardList, ArrowLeft } from 'lucide-react';
import AdminScoreBoxManager from '../admin/modals/AdminScoreBoxManager'; 
import './AdminScoreBoxes.css';

function AdminScoreBoxes() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar lista de planes al inicio
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get('/plans'); 
        setPlans(res.data);
      } catch (error) {
        console.error("Error cargando planes", error);
        // 👈 3. ALERTA SI FALLA LA CARGA
        showAlert("Error al cargar la lista de planes.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [showAlert]);

  return (
    <div className="admin-page-container">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="admin-header">
        {selectedPlan ? (
          <div className="header-with-back">
            <button onClick={() => setSelectedPlan(null)} className="back-btn-circle">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1>Gestionar Métricas</h1>
              <p className="subtitle">Editando: <strong>{selectedPlan.title}</strong></p>
            </div>
          </div>
        ) : (
          <div>
            <h1>ScoreBox</h1>
            <p className="subtitle">Selecciona un plan para definir qué ejercicios o tests deben realizar los alumnos.</p>
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="admin-content-wrapper">
        
        {loading && <p>Cargando planes...</p>}

        {!loading && !selectedPlan && (
          // --- VISTA 1: LISTA DE PLANES (SELECTOR) ---
          <div className="plans-grid-selector">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className="plan-card-item"
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="plan-icon">
                  <ClipboardList size={28} />
                </div>
                <div className="plan-details">
                  <h3>{plan.title}</h3>
                  <span>{plan.active ? 'Activo' : 'Inactivo'} • ID: {plan.id}</span>
                </div>
                <ChevronRight size={24} className="arrow-indicator"/>
              </div>
            ))}
            
            {plans.length === 0 && (
              <p>No tienes planes creados. Ve a la sección Planes primero.</p>
            )}
          </div>
        )}

        {!loading && selectedPlan && (
          // --- VISTA 2: EL GESTOR DE METRICAS ---
          <div className="manager-container fade-in">
             <AdminScoreBoxManager planId={selectedPlan.id} />
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminScoreBoxes;