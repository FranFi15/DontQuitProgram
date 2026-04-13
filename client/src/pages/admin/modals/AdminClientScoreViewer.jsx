import { useState, useEffect } from 'react';
import axios from '../../../api/axios'; 
import { useAlert } from '../../../context/AlertContext'; 
import './AdminClientScoreViewer.css';

function AdminClientScoreViewer({ planId, userId }) {
  const { showAlert } = useAlert(); 
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId || !userId) return;

    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/scoreboxes/plan/${planId}?userId=${userId}`);
        setScores(res.data);
      } catch (error) {
        console.error("Error cargando scores:", error);
        showAlert("Error al cargar las marcas del atleta.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [planId, userId, showAlert]); 

  if (loading) return <div className="loader-mini">Cargando datos...</div>;
  
  if (scores.length === 0) {
    return <p className="no-data-txt">Este plan no tiene métricas configuradas por el Admin.</p>;
  }

  return (
    <div className="client-score-viewer">
      <div className="score-table-header">
        <span className="th-name">Prueba </span>
        <span className="th-val">Historial de Resultados</span>
        <span className="th-date">Fecha</span>
      </div>
      
      <div className="score-table-body">
        {scores.map(box => {
          
          // CASO 1: Nunca registró nada
          if (!box.entries || box.entries.length === 0) {
            return (
              <div key={box.id} className="score-row">
                <div className="td-name">
                  <span className="test-name">{box.name}</span>
                  <span className="test-unit">{box.measureUnit}</span>
                </div>
                <div className="td-val">
                  <span className="val-empty">- -</span>
                </div>
                <div className="td-date"></div>
              </div>
            );
          }

          // CASO 2: Tiene registros. Mapeamos la prueba 1 sola vez y apilamos los resultados.
          return (
            <div key={box.id} className="score-row" style={{ alignItems: 'flex-start' }}>
              
              {/* COLUMNA 1: Nombre de la prueba */}
              <div className="td-name">
                <span className="test-name">{box.name}</span>
                <span className="test-unit">{box.measureUnit}</span>
              </div>
              
              {/* COLUMNA 2: Resultados apilados uno abajo del otro (usando div) */}
              <div className="td-val">
                {box.entries.map((entry, index) => (
                  <div 
                    key={entry.id || index}
                    style={{
                      fontWeight: index === 0 ? '600' : '400',
                      fontSize: index === 0 ? '0.8rem' : '0.75rem',
                      color: index === 0 ? '#111' : '#6b7280',
                      marginBottom: '10px' 
                    }}
                  >
                    {entry.value}
                  </div>
                ))}
              </div>

              {/* COLUMNA 3: Fechas apiladas respetando el orden de los resultados (usando div) */}
              <div className="td-date">
                {box.entries.map((entry, index) => (
                  <div 
                    key={entry.id || index}
                    style={{
                      fontSize: index === 0 ? '0.8rem' : '0.75rem',
                      color: index === 0 ? '#666' : '#9ca3af',
                      fontWeight: index === 0 ? '600' : '500',
                      marginBottom: '10px' // 👈 Mismo espacio para que queden en la misma línea que el resultado
                    }}
                  >
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminClientScoreViewer;