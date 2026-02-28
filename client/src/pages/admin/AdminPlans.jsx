import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import './AdminPlans.css';
import CreatePlanModal from './modals/CreatePlanModal';
import PlanStudentsModal from './modals/PlanStudentsModal';
import FollowUpControl from './modals/FollowUpControl';
import { Trash2, Search, Filter, Power, MessageCircle } from 'lucide-react'; 

function AdminPlans() {
  const navigate = useNavigate();
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc'); 

  const [selectedPlanForStudents, setSelectedPlanForStudents] = useState(null);

  useEffect(() => {
    fetchPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/plans');
      setPlans(res.data);
    } catch (error) {
      console.error(error);
      // 👈 3. ALERTA DE ERROR DE RED
      showAlert("Error al cargar los planes.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredAndSortedPlans = plans
    .filter((plan) => 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'name-asc') return a.title.localeCompare(b.title);
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      return 0;
    });

  // --- ACCIONES ---
  const handleCreate = () => { setPlanToEdit(null); setIsModalOpen(true); };
  const handleEdit = (plan) => { setPlanToEdit(plan); setIsModalOpen(true); };
  
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este plan?")) return;
    try {
      await axios.delete(`/plans/${id}`);
      fetchPlans();
      // 👈 4. ALERTA DE ÉXITO AL ELIMINAR
      showAlert("Plan eliminado correctamente.", "success");
    } catch (error) { 
        if(error.response?.status === 400) {
            // 👈 5. ALERTA DE ERROR DEL BACKEND (Ej: Hay alumnos activos)
            showAlert(error.response.data.error, "error");
        } else {
            // 👈 6. ALERTA DE ERROR GENÉRICO
            showAlert("Error al eliminar el plan.", "error"); 
        }
    }
  };

  // TOGGLE STOCK (Activar/Pausar)
  const handleToggleStatus = async (plan) => {
    try {
       await axios.patch(`/plans/${plan.id}/toggle-status`);
       fetchPlans(); 
       
       // 👈 7. ALERTA DE ÉXITO AL CAMBIAR ESTADO
       const newStatus = !plan.isActive ? "activado" : "pausado";
       showAlert(`El plan ha sido ${newStatus}.`, "success");
       
    } catch (error) {
       // 👈 8. ALERTA DE ERROR AL CAMBIAR ESTADO
       showAlert("Error al cambiar el estado del plan.", "error");
    }
  };

  if (loading) return <div className="plans-container">Cargando...</div>;

  return (
    <div className="plans-container">
      
      <div className="plans-header">
        <h1 className="plans-title">Planes de Entrenamiento</h1>
        <button className="new-plan-btn" onClick={handleCreate}>
          + Nuevo Plan
        </button>
      </div>

      {/* 1. CONTROL DE CUPOS (Arriba de todo) */}
      <FollowUpControl />

      {/* 2. BARRA DE HERRAMIENTAS */}
      <div className="plans-toolbar">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar plan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="sort-wrapper">
          <Filter size={18} className="sort-icon" />
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="name-asc">Nombre (A - Z)</option>
            <option value="price-asc">Precio (Menor a Mayor)</option>
            <option value="price-desc">Precio (Mayor a Menor)</option>
          </select>
        </div>
      </div>

      {/* 3. GRID DE PLANES */}
      <div className="plans-grid">
        {filteredAndSortedPlans.length === 0 ? (
          <div className="empty-plans">
            <p>No se encontraron planes.</p>
          </div>
        ) : (
          filteredAndSortedPlans.map((plan) => (
            <div key={plan.id} className={`plan-card ${!plan.isActive ? 'card-paused' : ''}`}>
              
              <div className="plan-card-header">
                <div>
                    {/* CATEGORÍA (Si existe) */}
                    {plan.planType && <span className="category-tag">{plan.planType.name}</span>}
                    <h3>{plan.title}</h3>
                </div>
                
                <div className="price-tag-container">
                    <span className="plan-price">${plan.price}</span>
                    {plan.internationalPrice > 0 && (
                        <span className="usd-price">u$d {plan.internationalPrice}</span>
                    )}
                </div>
              </div>
              
              {/* BADGES DE ESTADO */}
              <div className="badges-row">
                 {/* Si está pausado manual */}
                 {!plan.isActive && <span className="badge badge-paused">⏸ PAUSADO</span>}
                 
                 {/* Si es con seguimiento */}
                 {plan.hasFollowUp && <span className="badge badge-chat"><MessageCircle size={12}/> CHAT</span>}

                 {/* Si no hay stock por cupos llenos */}
                 {plan.outOfStock && plan.hasFollowUp && (
                    <span className="badge badge-error">⛔ SIN CUPO</span>
                 )}
              </div>

              <p className="plan-desc">{plan.description || "Sin descripción"}</p>
              
              <div className="plan-stats">
                <span>📅 {plan.duration} Semanas (+2)</span>
                <span className="plan-users" 
                  onClick={() => setSelectedPlanForStudents(plan)} 
                  title="Ver alumnos inscritos">
                    👥 {plan.subscriptions?.length || 0} Alumnos
                </span>
              </div>

              <div className="plan-actions">
                {/* BOTÓN POWER (STOCK) */}
                <button 
                    className={`btn-icon ${plan.isActive ? 'btn-power-on' : 'btn-power-off'}`}
                    onClick={() => handleToggleStatus(plan)}
                    title={plan.isActive ? "Pausar Venta" : "Activar Venta"}
                >
                    <Power size={18} />
                </button>

                <button className="btn-edit" onClick={() => handleEdit(plan)}>Editar</button>
                <button className="btn-view" onClick={() => navigate(`/admin/plans/${plan.id}`)}>Rutina</button>
                <button className="btn-delete-icon" onClick={() => handleDelete(plan.id)}>
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <CreatePlanModal 
          planToEdit={planToEdit}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchPlans} 
        />
      )}
      {selectedPlanForStudents && (
        <PlanStudentsModal 
          plan={selectedPlanForStudents}
          onClose={() => setSelectedPlanForStudents(null)}
          onUpdate={fetchPlans} 
        />
      )}
    </div>
  );
}

export default AdminPlans;