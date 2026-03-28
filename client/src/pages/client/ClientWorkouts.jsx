import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { ChevronRight, ArrowLeft, CheckCircle, Calendar, Info, ChevronDown, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import './ClientWorkouts.css';
import ScoreBoxModal from './modals/ScoreBoxModal';
import FinishWorkoutModal from './modals/FinishWorkoutModal'; 

function ClientWorkouts() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const userId = user ? user.id : null;

  // Lógica para saber si tiene seguimiento (habilita el botón de Terminar Entreno)
  const hasChatAccess = user?.subscription?.plan?.hasFollowUp;

  const [loading, setLoading] = useState(true);
  
  // ESTADOS DE DATOS
  const [availablePlans, setAvailablePlans] = useState([]); 
  const [selectedPlanId, setSelectedPlanId] = useState(null); 
  const [structure, setStructure] = useState({});
  const [planMeta, setPlanMeta] = useState({});
  
  // ESTADOS DE NAVEGACIÓN
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayWorkout, setSelectedDayWorkout] = useState(null); 
  
  // ESTADO DEL DROPDOWN PERSONALIZADO
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isScoreBoxOpen, setIsScoreBoxOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false); 

  const [completedWorkouts, setCompletedWorkouts] = useState(() => {
    // Leemos de la memoria del celular si ya terminó algunos antes
    const saved = localStorage.getItem(`completed_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. CARGAR LISTA DE PLANES
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      try {
        const res = await axios.get(`/workouts/my-plans/${userId}`);
        setAvailablePlans(res.data);
        
        if (res.data.length > 0) {
          setSelectedPlanId(res.data[0].planId);
        } else {
          setLoading(false); 
        }
      } catch (error) {
        console.error("Error fetching plans", error);
        // 👈 3. ALERTA SI FALLA LA CARGA DE SUS PLANES
        showAlert("No pudimos cargar tus planes activos.", "error");
        setLoading(false);
      }
    };
    fetchPlans();
  }, [userId, showAlert]);

  // 2. CARGAR RUTINA CUANDO CAMBIA EL PLAN SELECCIONADO
  useEffect(() => {
    if (!userId || !selectedPlanId) return;
    setLoading(true);

    const fetchRoutine = async () => {
      try {
        const res = await axios.get(`/workouts/my-routine/${userId}?planId=${selectedPlanId}`);
        
        setStructure(res.data.structure);
        setPlanMeta({
          name: res.data.planName,
          start: res.data.startDate,
          currentWeek: res.data.currentWeek
        });

        const weeksAvailable = Object.keys(res.data.structure).map(Number);
        if (weeksAvailable.includes(res.data.currentWeek)) {
          setSelectedWeek(res.data.currentWeek);
        } else if (weeksAvailable.length > 0) {
          setSelectedWeek(weeksAvailable[0]);
        }
        
      } catch (error) {
        console.error(error);
        // 👈 4. ALERTA SI FALLA LA CARGA DE LA RUTINA
        showAlert("Error al cargar la rutina de este plan.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [userId, selectedPlanId, showAlert]);

  const markAsCompleted = (workoutId) => {
    const updatedList = [...completedWorkouts, workoutId];
    setCompletedWorkouts(updatedList);
    localStorage.setItem(`completed_${userId}`, JSON.stringify(updatedList)); // Guardamos en memoria
    setIsFinishModalOpen(false); // Cerramos el modal
    
    // 👈 5. ALERTA DE ÉXITO AL TERMINAR ENTRENAMIENTO
    showAlert("¡Excelente trabajo! Entrenamiento completado.", "success");
  };
  
  if (loading && availablePlans.length === 0) return <div className="p-4">Cargando...</div>;

  if (availablePlans.length === 0 && !loading) return (
    <div className="error-container">
      <Info size={48} className="text-gray-400 mb-2"/>
      <p>No tienes planes activos.</p>
    </div>
  );

  // VISTA 1: DETALLE DE LA RUTINA 
  if (selectedDayWorkout) {
     const blocks = typeof selectedDayWorkout.blocks === 'string' ? JSON.parse(selectedDayWorkout.blocks) : selectedDayWorkout.blocks;
     
     return (
        <div className="workout-detail-view animate-slide-in">
           <div className="detail-navbar">
              <button onClick={() => setSelectedDayWorkout(null)} className="back-link">
                 <ArrowLeft size={20} /> Volver
              </button>
           </div>

           <div className="detail-header-large">
             <h1>{selectedDayWorkout.title}</h1>
             <p className="detail-subtitle">{blocks.length} Ejercicios</p>
           </div>

           <div className="blocks-list">
             {blocks.map((block, i) => {
               const safeHtmlContent = (block.content || block.notes || '')
                 .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
                 .replace(/href="(?!(?:http:\/\/|https:\/\/|mailto:|tel:))([^"]+)"/gi, 'href="https://$1"');

               return (
                 <div key={i} className="exercise-card">
                    <span className="exercise-name">{block.name || block.title}</span>
                    <div 
                      className="exercise-notes-html" 
                      dangerouslySetInnerHTML={{__html: safeHtmlContent}}
                    />
                 </div>
               )
             })}
             
            
            {hasChatAccess && (
               <button 
                 className="finish-workout-btn"
                 style={{ 
                   backgroundColor: completedWorkouts.includes(selectedDayWorkout.id) ? '#10b981' : '#000',
                   cursor: completedWorkouts.includes(selectedDayWorkout.id) ? 'default' : 'pointer'
                 }}
                 onClick={() => {
                   if (!completedWorkouts.includes(selectedDayWorkout.id)) {
                     setIsFinishModalOpen(true);
                   }
                 }}
                 disabled={completedWorkouts.includes(selectedDayWorkout.id)}
               >
                 {completedWorkouts.includes(selectedDayWorkout.id) 
                   ? 'Entrenamiento Completado' 
                   : 'Terminar Entrenamiento'}
               </button>
             )}
           </div>

           {isFinishModalOpen && (
             <FinishWorkoutModal
               workoutTitle={selectedDayWorkout.title}
               weekName={`Semana ${selectedWeek}`}
               userId={userId}
               onClose={() => setIsFinishModalOpen(false)}
               onSuccess={() => markAsCompleted(selectedDayWorkout.id)} 
             />
           )}
        </div>
     )
  }

  // VISTA 2: OVERVIEW (Resumen semanal)
  const weekNumbers = Object.keys(structure).map(Number).sort((a,b) => a-b);
  const daysInCurrentWeek = structure[selectedWeek] || [];
  
  const currentPlan = availablePlans.find(p => p.planId === selectedPlanId);

  return (
    <div className="workouts-overview-page">
      
      {/* HEADER CON CUSTOM DROPDOWN */}
      <div className="plan-info-header">
        {availablePlans.length > 1 ? (
          <div className="custom-dropdown-container" ref={dropdownRef}>
            <div 
              className="dropdown-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <h2 className="user-plan-title trigger-text">
                {currentPlan?.planName}
              </h2>
              <ChevronDown 
                size={24} 
                className={`trigger-icon ${isDropdownOpen ? 'rotate' : ''}`}
              />
            </div>

            {isDropdownOpen && (
              <div className="dropdown-menu-list animate-pop-in">
                {availablePlans.map(p => (
                  <div 
                    key={p.planId} 
                    className={`dropdown-item ${p.planId === selectedPlanId ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPlanId(p.planId);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {p.planName}
                    {p.planId === selectedPlanId && <CheckCircle size={16} color="black"/>}
                  </div>
                ))}
              </div>
            )}
            <button 
             className= "open-scorebox-btn"
             onClick={() => setIsScoreBoxOpen(true)}
             style={{marginTop: 10}} 
           >
              <ClipboardList size={18}/> Mis Marcas
           </button>
          </div>
        ) : (
          <h2 className="user-plan-title">{planMeta.name}</h2>
        )}
      </div>

      {/* SELECTOR DE SEMANAS */}
      <div className="weeks-slider-container">
        <div className="weeks-slider">
          {weekNumbers.map(num => (
            <button 
              key={num}
              onClick={() => setSelectedWeek(num)}
              className={`week-chip ${selectedWeek === num ? 'active' : ''}`}
            >
              Semana {num}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE DÍAS */}
      <div className="days-list-container">
        {daysInCurrentWeek.length === 0 ? (
          <p className="empty-msg">No hay rutina cargada para esta semana.</p>
        ) : (
          <div className="days-vertical-list">
            {daysInCurrentWeek.map((workout) => (
              <div 
                key={workout.id} 
                className="day-item-card"
                onClick={() => setSelectedDayWorkout(workout)}
              >
                <div className="day-icon-box">
                  <span className="day-idx">Día</span>
                  <span className="day-val">{workout.dayNumber}</span>
                </div>
                <div className="day-info">
                  <span className="day-title">{workout.title}</span>
                  <span className="day-sub">{Array.isArray(JSON.parse(workout.blocks || '[]')) ? JSON.parse(workout.blocks || '[]').length : 0} Bloques</span>
                </div>
                <ChevronRight className="arrow-icon" size={20}/>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isScoreBoxOpen && selectedPlanId && (
         <ScoreBoxModal 
           planId={selectedPlanId} 
           userId={userId} 
           onClose={() => setIsScoreBoxOpen(false)} 
         />
       )}
    </div>
  );
}

export default ClientWorkouts;