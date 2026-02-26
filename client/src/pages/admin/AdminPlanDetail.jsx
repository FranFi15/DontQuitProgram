// client/src/pages/admin/AdminPlanDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { ArrowLeft, Plus, Trash2, Edit3, Save, AlertCircle } from 'lucide-react'; 
import DayEditorModal from './modals/DayEditorModal';
import './AdminPlanDetail.css';

function AdminPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // --- ACCIONES DE SEMANA ---
  
  // --- LÓGICA DE LÍMITE DE SEMANAS ---
  const maxWeeks = plan ? plan.duration * 4 : 0; 
  const currentWeeksCount = weekNumbers.length;
  const isMaxReached = currentWeeksCount >= maxWeeks;

  // --- ACCIONES DE SEMANA ---
  const handleAddWeek = async () => {
    // 1. Validación estricta por CANTIDAD (Count)
    if (weekNumbers.length >= maxWeeks) {
      alert(`¡Límite alcanzado! Ya tienes ${weekNumbers.length} semanas creadas (Máximo: ${maxWeeks}). Borra una para crear otra.`);
      return;
    }


    let nextWeekToCreate = 1;
    while (weekNumbers.includes(nextWeekToCreate)) {
      nextWeekToCreate++;
    }

    if (nextWeekToCreate > maxWeeks) {
         alert(`Error inesperado: Intentando crear semana ${nextWeekToCreate} fuera del límite.`);
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
    } catch (error) {
      console.error(error);
      alert("Error al crear la semana");
    }
  };

  const handleEditWeekNumber = async (currentWeekNum) => {
    const newNum = prompt("Ingresa el nuevo número para esta semana:", currentWeekNum);
    if (!newNum || newNum === String(currentWeekNum)) return;

    try {
      await axios.put(`/workouts/week/${id}/${currentWeekNum}`, {
        newWeekNumber: newNum
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Error al cambiar número de semana");
    }
  };

  const handleDeleteWeek = async (weekNum) => {
    if(!window.confirm(`⚠️ ¿Estás segura de borrar TODA la Semana ${weekNum}? Se borrarán todos sus días.`)) return;
    try {
      await axios.delete(`/workouts/week/${id}/${weekNum}`);
      fetchData();
    } catch (error) {
      alert("Error al eliminar semana");
    }
  };

  // --- ACCIONES DE DÍA ---

  const handleAddDay = async (weekNum) => {
    const daysInWeek = weeks[weekNum] || [];
    // Calculamos el siguiente día basándonos en el último (o 1 si es nuevo)
    const lastDayNum = daysInWeek.length > 0 ? daysInWeek[daysInWeek.length - 1].dayNumber : 0;
    const nextDay = lastDayNum + 1;
    
    await axios.post(`/workouts/${id}`, {
      weekNumber: weekNum,
      dayNumber: nextDay,
      title: `Día ${nextDay}`,
      blocks: []
    });
    fetchData();
  };

  const handleEditDayTitle = async (workout) => {
    const newTitle = prompt(`Nuevo nombre para el día (Actual: ${workout.title}):`, workout.title);
    
    // Si cancela o lo deja vacío, no hacemos nada
    if (newTitle === null || newTitle.trim() === "") return;

    try {
      await axios.put(`/workouts/${workout.id}`, {
        title: newTitle // Enviamos el nuevo título
      });
      fetchData(); // Recargamos
    } catch (error) {
      alert(error.response?.data?.error || "Error al cambiar el nombre");
    }
  };

  const handleDeleteDay = async (workoutId) => {
    if(!window.confirm("¿Borrar este día?")) return;
    try {
      await axios.delete(`/workouts/${workoutId}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el día");
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
          <h1 className="plan-title">{plan.title}</h1>
          <div className="plan-meta">
            <span>📅 {plan.duration} Meses</span>
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