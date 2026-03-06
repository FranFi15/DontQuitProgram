// client/src/pages/admin/AdminPlanDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { ArrowLeft, Plus, Trash2, Edit3, Save, AlertCircle } from 'lucide-react'; 
import DayEditorModal from './modals/DayEditorModal';
import './AdminPlanDetail.css';

function AdminPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  
  const [plan, setPlan] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Funciones de carga
  const fetchData = async () => {
    try {
      const [planRes, workoutsRes] = await Promise.all([
        axios.get(`/plans/${id}`),
        axios.get(`/workouts/${id}`)
      ]);
      setPlan(planRes.data);
      setWorkouts(workoutsRes.data);
    } catch (error) {
      console.error(error);
      // 👈 3. ALERTA SI FALLA LA CARGA
      showAlert("Error al cargar los detalles del plan.", "error");
      navigate('/admin/plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // AGRUPAR DÍAS POR SEMANA
  const weeks = workouts.reduce((acc, workout) => {
    const week = workout.weekNumber;
    if (!acc[week]) acc[week] = [];
    acc[week].push(workout);
    return acc;
  }, {});

  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  // --- LÓGICA DE LÍMITE DE SEMANAS ---
  const maxWeeks = plan ? plan.duration  : 0; 
  const currentWeeksCount = weekNumbers.length;
  const isMaxReached = currentWeeksCount >= maxWeeks;

  // --- ACCIONES DE SEMANA ---
  const handleAddWeek = async () => {
    if (weekNumbers.length >= maxWeeks) {
      // 👈 4. ALERTA DE LÍMITE ALCANZADO
      showAlert(`¡Límite alcanzado! Máximo: ${maxWeeks} semanas. Borra una para crear otra.`, "info");
      return;
    }

    let nextWeekToCreate = 1;
    while (weekNumbers.includes(nextWeekToCreate)) {
      nextWeekToCreate++;
    }

    if (nextWeekToCreate > maxWeeks) {
         showAlert(`Error: Intentando crear semana ${nextWeekToCreate} fuera del límite.`, "error");
         return;
    }

    try {
      await axios.post(`/workouts/${id}`, {
        weekNumber: nextWeekToCreate,
        dayNumber: 1,
        title: 'Día 1',
        blocks: []
      });
      fetchData();
      // Opcional: showAlert(`Semana ${nextWeekToCreate} creada`, "success");
    } catch (error) {
      console.error(error);
      showAlert("Error al crear la semana.", "error");
    }
  };

  const handleEditWeekNumber = async (currentWeekNum) => {
    // Mantenemos prompt porque necesitamos el input del usuario
    const newNum = prompt("Ingresa el nuevo número para esta semana:", currentWeekNum);
    if (!newNum || newNum === String(currentWeekNum)) return;

    try {
      await axios.put(`/workouts/week/${id}/${currentWeekNum}`, {
        newWeekNumber: newNum
      });
      fetchData();
      showAlert("Número de semana actualizado.", "success");
    } catch (error) {
      showAlert(error.response?.data?.error || "Error al cambiar número de semana", "error");
    }
  };

  const handleDeleteWeek = async (weekNum) => {
    // Mantenemos confirm por seguridad
    if(!window.confirm(`⚠️ ¿Estás segura de borrar TODA la Semana ${weekNum}? Se borrarán todos sus días.`)) return;
    try {
      await axios.delete(`/workouts/week/${id}/${weekNum}`);
      fetchData();
      showAlert(`Semana ${weekNum} eliminada.`, "success");
    } catch (error) {
      showAlert("Error al eliminar la semana.", "error");
    }
  };

  // --- ACCIONES DE DÍA ---
  const handleAddDay = async (weekNum) => {
    const daysInWeek = weeks[weekNum] || [];
    const lastDayNum = daysInWeek.length > 0 ? daysInWeek[daysInWeek.length - 1].dayNumber : 0;
    const nextDay = lastDayNum + 1;
    
    // Agregamos try/catch por seguridad
    try {
      await axios.post(`/workouts/${id}`, {
        weekNumber: weekNum,
        dayNumber: nextDay,
        title: `Día ${nextDay}`,
        blocks: []
      });
      fetchData();
    } catch (error) {
      showAlert("Error al agregar el día.", "error");
    }
  };

  const handleEditDayTitle = async (workout) => {
    const newTitle = prompt(`Nuevo nombre para el día (Actual: ${workout.title}):`, workout.title);
    if (newTitle === null || newTitle.trim() === "") return;

    try {
      await axios.put(`/workouts/${workout.id}`, {
        title: newTitle 
      });
      fetchData(); 
      showAlert("Nombre del día actualizado.", "success");
    } catch (error) {
      showAlert(error.response?.data?.error || "Error al cambiar el nombre del día.", "error");
    }
  };

  const handleDeleteDay = async (workoutId) => {
    if(!window.confirm("¿Borrar este día de la rutina?")) return;
    try {
      await axios.delete(`/workouts/${workoutId}`);
      fetchData();
      showAlert("Día eliminado.", "success");
    } catch (error) {
      console.error(error);
      showAlert("Error al eliminar el día.", "error");
    }
  };

  const handleEditDay = (workout) => {
    setSelectedWorkout(workout);
    setIsEditorOpen(true);
  };

  if (loading) return <div className="plan-detail-container">Cargando...</div>;

  return (
    <div className="plan-detail-container">
      {/* HEADER */}
      <button onClick={() => navigate('/admin/plans')} className="back-btn">
        <ArrowLeft size={20} /> Volver a Planes
      </button>

      <div className="detail-header">
        <div>
          <h1 className="admin-plan-title">{plan.title}</h1>
          <div className="plan-meta">
            <span>📅 {plan.duration} Semanas</span>
            <span >
              {currentWeeksCount} / {maxWeeks} Semanas creadas
            </span>
            <span className="plan-price">💲 {plan.price}</span>
          </div>
        </div>
      </div>

      {/* LISTA DE SEMANAS */}
      <div className="weeks-container">
        {weekNumbers.length === 0 ? (
          <div className="weeks-placeholder">
            <h3 className="placeholder-text">El plan está vacío</h3>
            <button onClick={handleAddWeek} className="add-week-btn">
              <Plus size={20} /> Crear Semana 1
            </button>
          </div>
        ) : (
          <>
            {weekNumbers.map((weekNum) => (
              <div key={weekNum} className="week-card animate-enter">
                
                {/* Cabecera de la Semana */}
                <div className="week-header">
                  <div className="flex items-center gap-2">
                    <h2 className="week-title">Semana {weekNum}</h2>
                  </div>

                  <div className="week-actions">
                    <button 
                      onClick={() => handleEditWeekNumber(weekNum)}
                      className="week-action-btn edit"
                      title="Cambiar número de semana"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleAddDay(weekNum)}
                      className="week-action-btn add"
                      title="Agregar Día"
                    >
                      <Plus size={16} /> Día
                    </button>
                    <button 
                      onClick={() => handleDeleteWeek(weekNum)}
                      className="week-action-btn delete"
                      title="Borrar Semana"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid de Días */}
                <div className="days-grid">
                  {weeks[weekNum].map((workout) => (
                    <div key={workout.id} className="day-card relative group">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteDay(workout.id); }}
                        className="delete-day-btn"
                        title="Eliminar Día"
                      >
                        <XIcon />
                      </button>

                      <div className="day-card-header">
                        <div className="day-header-left">
                          <span className="day-number">{workout.title}</span>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditDayTitle(workout); }}
                            className="edit-day-num-btn"
                            title="Cambiar nombre"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleEditDay(workout)}
                        className="edit-day-btn"
                      >
                        <Edit3 size={16} /> Editar Rutina
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!isMaxReached ? (
              <button onClick={handleAddWeek} className="add-next-week-btn">
                <Plus size={20} /> Agregar Siguiente Semana
              </button>
            ) : (
              <div className="max-weeks-reached">
                <AlertCircle size={20} />
                <span>Has completado las {maxWeeks} semanas de este plan.</span>
              </div>
            )}
          </>
        )}
      </div>

      {isEditorOpen && selectedWorkout && (
        <DayEditorModal 
          workout={selectedWorkout}
          planLevels={plan.levelDefinitions} 
          onClose={() => setIsEditorOpen(false)}
          onSuccess={() => { fetchData(); }}
        />
      )}
    </div>
  );
}

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default AdminPlanDetail;