// client/src/pages/client/ClientHome.jsx
import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Trophy, Dumbbell, Calendar, Search, Clock, PlayCircle, ShoppingBag } from 'lucide-react'; 
import RMCalculatorModal from './modals/RMCalculatorModal';
import RMDetailModal from './modals/RMDetailModal';
import HomePlanScores from '../client/modals/HomePlanScores';
import './ClientHome.css';

function ClientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState([]);
  const [scorePlans, setScorePlans] = useState([]);
  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
const [selectedScorePlanId, setSelectedScorePlanId] = useState(null);

  // Estados de Modals y Filtros
  const [isRMModalOpen, setIsRMModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [glossarySearchTerm, setGlossarySearchTerm] = useState('');

  const fetchData = async () => {
    if (!user) return;
    try {
      const [plansRes, recordsRes, historyRes, exercisesRes] = await Promise.all([
        axios.get(`/workouts/my-plans/${user.id}`), 
        axios.get(`/records/${user.id}`),
        axios.get(`/scoreboxes/history/${user.id}`),
        axios.get('/exercises')
      ]);
      setPlans(plansRes.data);
      setRecords(recordsRes.data);
      setScorePlans(historyRes.data);
      setExercises(exercisesRes.data);
      

      if (historyRes.data.length > 0) {
        setSelectedScorePlanId(historyRes.data[0].planId);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // --- LÓGICA DE GÉNERO (NUEVO) ---
  const isMale = user?.sex === 'Masculino' ;
  const isFemale = user?.sex === 'Femenino';
  
  const readyWord = isMale ? 'listo' : isFemale ? 'lista' : 'liste';

  // --- LÓGICA DE FILTRADO ---
  const filteredRecords = records.filter(rec => 
    rec.exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(glossarySearchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4">Cargando perfil...</div>;

  return (
    <div className="client-home-page">
      
      {/* HEADER */}
      <header className="home-header-section">
        <div>
          <h1 className="greeting-title">Hola, {user?.name?.split(' ')[0]} 👋</h1>
          {/* AQUÍ SE APLICA EL CAMBIO DE GÉNERO */}
          <p className="greeting-subtitle">¿Estás {readyWord} para entrenar?</p>
        </div>
      </header>

      {/* SECCIÓN 1: PLANES (MODIFICADO) */}
      <section className="section-container">
        <div className="section-header">
          <h2>Mis Planes</h2>
          <button 
            onClick={() => navigate('/app/store')} 
            style={{
              background: '#111', color: 'white', border: 'none', padding: '6px 12px', 
              borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', 
              textTransform: 'uppercase', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center'
            }}
          >
            <ShoppingBag size={14} /> Tienda
          </button>
        </div>
        {plans.length === 0 ? (
          <div className="empty-card"><p>No tienes planes activos aún.</p></div>
        ) : (
          <div className="plans-list-vertical">
            {plans.map((plan) => (
              <div key={plan.planId} className="plan-home-card" onClick={() => navigate(`/app/workouts`)}>
                
                {/* Icono a la izquierda */}
                <div className="plan-icon-box">
                    <Dumbbell size={24} color="white" />
                </div>
                
                {/* Info Central (NUEVO DISEÑO) */}
                <div className="plan-info">
                  <h3>{plan.planName}</h3>
                  
                  <div className="plan-meta-grid">
                    {/* Duración */}
                    <div className="meta-item">
                        <Clock size={12} className="meta-icon"/>
                        {/* Si el back no manda duration, mostramos un default o nada */}
                        <span>{plan.duration} Semanas</span>
                    </div>

                    {/* Fechas */}
                    <div className="meta-item">
                        <Calendar size={12} className="meta-icon"/>
                        <span>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="action-circle"><ChevronRight size={18} /></div>
              </div>
            ))}
          </div>
        )}
        </section>
        {/* SECCIÓN 2: Glosario  */}
        <section className="section-container glossary-section">
        <div className="section-header">
          <h2>Glosario</h2>
        </div>
        
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar ejercicio..." 
            value={glossarySearchTerm}
            onChange={(e) => setGlossarySearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {/* Solo mostramos resultados si el usuario escribió algo */}
        {glossarySearchTerm.trim() !== '' && (
          <div className="glossary-results animate-fadeIn">
            {filteredExercises.length === 0 ? (
              <div className="empty-card" style={{padding: '1rem'}}>
                <p>No se encontraron ejercicios con ese nombre.</p>
              </div>
            ) : (
              <div className="glossary-grid">
                {filteredExercises.slice(0, 5).map(ex => ( // Limitamos a 5 resultados para no saturar la pantalla
                  <div key={ex.id} className="glossary-item-card">
                    <div className="glossary-item-info">
                      <h4>{ex.name}</h4>
                      {ex.description && <p>{ex.description}</p>}
                    </div>
                    {ex.videoUrl && (
                      <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="glossary-video-btn">
                        <PlayCircle size={24} color="black"/>
                      </a>
                    )}
                  </div>
                ))}
                {filteredExercises.length > 5 && (
                  <p className="glossary-more-text">...y {filteredExercises.length - 5} resultados más. Sé más específico.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
        {/* SECCIÓN 3: SCORES DE PLANES  */}
      {scorePlans.length > 0 && (
        <section className="section-container">
          <div className="section-header">
            <h2>Mis Marcas</h2>
          </div>
          
          {/* 1. SELECTOR HORIZONTAL DE PLANES */}
          <div className="score-tabs-container">
            {scorePlans.map(plan => (
              <button 
                key={plan.planId}
                onClick={() => setSelectedScorePlanId(plan.planId)}
                className={`score-tab-btn ${selectedScorePlanId === plan.planId ? 'active' : ''}`}
              >
                {plan.planName}
              </button>
            ))}
          </div>
          
          {/* 2. RENDERIZADO DINÁMICO (Solo mostramos el seleccionado) */}
          <div className="plan-scores-content">
            {selectedScorePlanId && (
              <HomePlanScores 
                key={selectedScorePlanId} 
                planId={selectedScorePlanId}
                planName={scorePlans.find(p => p.planId === selectedScorePlanId)?.planName}
                userId={user.id}
              />
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN 4: RÉCORDS (MANTENIDO EXACTAMENTE IGUAL) */}
      <section className="section-container ">
        <div className="section-header">
          <h2>Mis Récords</h2>
          <button className="add-rm-btn" onClick={() => setIsRMModalOpen(true)}>
            <Plus size={16} /> Nuevo
          </button>
        </div>

        {/* --- BARRA DE BÚSQUEDA --- */}
        {records.length > 0 && (
          <div className="search-bar-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar ejercicio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}

        <div className="records-list">
          {filteredRecords.length === 0 ? (
            <div className="empty-state-rm">
              {searchTerm ? <p>No se encontraron ejercicios.</p> : (
                <>
                  <Trophy size={32} className="text-gray-300 mb-2"/>
                  <p>Registra tus pesos máximos para medir tu progreso.</p>
                </>
              )}
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div 
                key={rec.id} 
                className="record-item"
                onClick={() => setSelectedRecord(rec)}
                style={{ cursor: 'pointer' }}
              >
                <div className="record-left">
                  <div className="trophy-box"><Trophy size={16} className="trophy-icon" /></div>
                  <div className="record-text">
                    <span className="rec-exercise">{rec.exercise}</span>
                    <span className="rec-detail">{rec.weight}kg x {rec.reps} reps</span>
                  </div>
                </div>
                <div className="record-right">
                  <span className="rm-value">{Math.round(rec.oneRM)} <small>KG</small></span>
                  <span className="rm-label">1RM</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MODALS */}
      {isRMModalOpen && (
        <RMCalculatorModal userId={user.id} onClose={() => setIsRMModalOpen(false)} onSuccess={fetchData} />
      )}

      {selectedRecord && (
        <RMDetailModal 
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={fetchData} 
        />
      )}

    </div>
  );
}

export default ClientHome;