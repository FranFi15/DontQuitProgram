import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { ClipboardList, Edit2, Target } from 'lucide-react'; 
import ScoreBoxModal from '../modals/ScoreBoxModal';
import './HomePlanScores.css';

function HomePlanScores({ planId, planName, userId }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. MOVEMOS LA FUNCIÓN ADENTRO PARA EVITAR WARNINGS Y PODER USAR showAlert BIEN
  const fetchBoxes = async () => {
    try {
      const res = await axios.get(`/scoreboxes/plan/${planId}?userId=${userId}`);
      setBoxes(res.data);
    } catch (error) {
      console.error("Error cargando scores", error);
      // 👈 4. ALERTA DE ERROR SI FALLA LA CARGA
      showAlert("Error al cargar tus marcas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, userId, showAlert]);

  if (!loading && boxes.length === 0) return null;

  return (
    <>
      <div className="home-score-card">
        <div className="score-card-header">
          <div className="header-left">
            <ClipboardList size={18} className="score-icon-main"/>
            <span className="score-plan-name">{planName}</span>
          </div>
          <button className="edit-score-btn" onClick={() => setIsModalOpen(true)}>
            <Edit2 size={14} /> Editar
          </button>
        </div>

        {/* FORMATO LISTA */}
        <div className="score-list">
          {boxes.map(box => {
            const entry = box.entries && box.entries.length > 0 ? box.entries[0] : null;
            return (
              <div key={box.id} className="score-list-item">
                
                {/* Lado Izquierdo: Icono y Nombre */}
                <div className="score-item-left">
                  <div className="score-icon-box">
                    <Target size={16} className="score-target-icon" />
                  </div>
                  <span className="score-label">{box.name}</span>
                </div>

                {/* Lado Derecho: Valor y Unidad */}
                <div className="score-item-right">
                  {entry ? (
                    <span className="score-value filled">
                      {entry.value} <small>{box.measureUnit}</small>
                    </span>
                  ) : (
                    <span className="score-value empty">- -</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <ScoreBoxModal 
          planId={planId}
          userId={userId}
          onClose={() => {
            setIsModalOpen(false);
            fetchBoxes();
          }}
        />
      )}
    </>
  );
}

export default HomePlanScores;