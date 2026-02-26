import { useState, useEffect } from 'react';
import axios from '../../../api/axios'; 
import './AdminClientScoreViewer.css';

function AdminClientScoreViewer({ planId, userId }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId || !userId) return;

    const fetchScores = async () => {
      setLoading(true);
      try {
        // Este endpoint trae la definición de las cajas Y el último resultado del usuario
        const res = await axios.get(`/scoreboxes/plan/${planId}?userId=${userId}`);
        setScores(res.data);
      } catch (error) {
        console.error("Error cargando scores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [planId, userId]);

  if (loading) return <div className="loader-mini">Cargando datos...</div>;
  
  if (scores.length === 0) {
    return <p className="no-data-txt">Este plan no tiene métricas configuradas por el Admin.</p>;
  }

  return (
    <div className="client-score-viewer">
      <div className="score-table-header">
        <span className="th-name">Prueba </span>
        <span className="th-val">Resultado</span>
        <span className="th-date">Fecha</span>
      </div>
      
      <div className="score-table-body">
        {scores.map(box => {
          // Extraemos la entrada más reciente (si existe)
          const entry = box.entries && box.entries.length > 0 ? box.entries[0] : null;
          
          return (
            <div key={box.id} className="score-row">
              {/* NOMBRE DE LA PRUEBA */}
              <div className="td-name">
                <span className="test-name">{box.name}</span>
                <span className="test-unit">{box.measureUnit}</span>
              </div>
              
              {/* VALOR CARGADO */}
              <div className="td-val">
                {entry ? (
                  <span className="val-txt">{entry.value}</span>
                ) : (
                  <span className="val-empty">- -</span>
                )}
              </div>

              {/* FECHA */}
              <div className="td-date">
                {entry ? new Date(entry.date).toLocaleDateString() : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminClientScoreViewer;