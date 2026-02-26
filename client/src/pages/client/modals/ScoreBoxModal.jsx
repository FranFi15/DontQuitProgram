import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { X, Save } from 'lucide-react';
import './ScoreBoxModal.css';

function ScoreBoxModal({ planId, userId, onClose }) {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputs, setInputs] = useState({});
  const [savingAll, setSavingAll] = useState(false); // Estado para el botón principal

  const fetchBoxes = async () => {
    try {
      const res = await axios.get(`/scoreboxes/plan/${planId}?userId=${userId}`);
      setBoxes(res.data);
      
      const initialInputs = {};
      res.data.forEach(box => {
        initialInputs[box.id] = {};
        if (box.entries && box.entries.length > 0) {
          const savedString = box.entries[0].value;
          const unitsArray = box.measureUnit ? box.measureUnit.split(',') : [];
          
          unitsArray.forEach(unit => {
            const regex = new RegExp(`([\\d.]+)\\s*${unit.trim()}`);
            const match = savedString.match(regex);
            if (match) {
              initialInputs[box.id][unit.trim()] = match[1]; 
            }
          });
        }
      });
      setInputs(initialInputs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoxes(); }, [planId, userId]);

  const handleInputChange = (boxId, unit, value) => {
    setInputs(prev => ({
      ...prev,
      [boxId]: {
        ...prev[boxId],
        [unit]: value
      }
    }));
  };

  // --- NUEVA LÓGICA: GUARDAR TODO JUNTO ---
  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      // 1. Preparamos todas las peticiones (promesas) que tenemos que hacer al backend
      const savePromises = boxes.map(box => {
        const boxInputs = inputs[box.id] || {};
        const unitsArray = box.measureUnit ? box.measureUnit.split(',') : [];
        
        // Armamos el texto final. Ej: "100 KG - 5 REPS"
        const finalStringParts = unitsArray.map(unit => {
          const val = boxInputs[unit.trim()];
          return val ? `${val} ${unit.trim()}` : null;
        }).filter(Boolean);

        // Si el usuario dejó esta prueba vacía, la ignoramos
        if (finalStringParts.length === 0) return null;

        const finalStringToSave = finalStringParts.join(' - ');
        const existingEntry = box.entries && box.entries.length > 0 ? box.entries[0] : null;

        // Si no cambió el valor respecto a la base de datos, no hacemos nada para ahorrar recursos
        if (existingEntry && existingEntry.value === finalStringToSave) return null;

        // Si ya existía, actualizamos (PUT), si es nuevo, creamos (POST)
        if (existingEntry) {
          return axios.put(`/scoreboxes/entry/${existingEntry.id}`, {
            userId, value: finalStringToSave
          });
        } else {
          return axios.post('/scoreboxes/entry', {
            userId, scoreBoxId: box.id, value: finalStringToSave
          });
        }
      }).filter(p => p !== null); // Filtramos los nulos (los que no cambiaron)

      // 2. Ejecutamos todas las peticiones en paralelo
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        alert("¡Marcas actualizadas correctamente! 🏆");
      }
      
      // Cerramos el modal
      onClose();

    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar los resultados.");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-bottom animate-slide-up">
        
        <div className="detail-modal-header">
           <div style={{width: 40}}></div> 
           <h3 className="modal-title">Mis Marcas</h3>
           <button onClick={onClose} className="icon-action-btn">
              <X size={24}/>
           </button>
        </div>

        {loading ? <p style={{textAlign: 'center', color: '#6b7280'}}>Cargando métricas...</p> : (
          <>
            <div className="scorebox-list">
              {boxes.length === 0 ? (
                <p className="empty-msg">Este plan no tiene métricas asignadas.</p>
              ) : (
                boxes.map(box => {
                  const unitsArray = box.measureUnit ? box.measureUnit.split(',') : ['VALOR'];
                  const boxInputData = inputs[box.id] || {};

                  return (
                    <div key={box.id} className="scorebox-item-vertical">
                      <div className="sb-header-row">
                        <span className="sb-name">{box.name}</span>
                      </div>

                      <div className="sb-multi-inputs">
                        {unitsArray.map((u, index) => {
                          const unitLabel = u.trim();
                          return (
                            <div key={index} className="sb-input-group">
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={boxInputData[unitLabel] || ''}
                                onChange={(e) => handleInputChange(box.id, unitLabel, e.target.value)}
                                className="sb-input-multi"
                              />
                              <span className="sb-unit-label">{unitLabel}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* BOTÓN ÚNICO GIGANTE ABAJO */}
            {boxes.length > 0 && (
              <div className="sb-footer-sticky">
                <button 
                  className="sb-save-all-btn" 
                  onClick={handleSaveAll}
                  disabled={savingAll}
                >
                  <Save size={20}/> 
                  {savingAll ? 'Guardando...' : 'Guardar Mis Marcas'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ScoreBoxModal;