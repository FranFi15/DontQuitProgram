import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, Save } from 'lucide-react';
import './ScoreBoxModal.css';

function ScoreBoxModal({ planId, userId, onClose }) {
  const { showAlert } = useAlert(); 
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputs, setInputs] = useState({});
  const [savingAll, setSavingAll] = useState(false); 

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
            const trimmedUnit = unit.trim();
            // 👇 CAMBIO: Regex más flexible para capturar texto antes de la unidad
            // Captura todo hasta que encuentra el nombre de la unidad
            const regex = new RegExp(`(.*?)\\s*${trimmedUnit}(?:\\s*-|$)`);
            const match = savedString.match(regex);
            if (match) {
              initialInputs[box.id][trimmedUnit] = match[1].trim(); 
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

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const savePromises = boxes.map(box => {
        const boxInputs = inputs[box.id] || {};
        const unitsArray = box.measureUnit ? box.measureUnit.split(',') : [];
        
        const finalStringParts = unitsArray.map(unit => {
          const val = boxInputs[unit.trim()];
          return val ? `${val} ${unit.trim()}` : null;
        }).filter(Boolean);

        if (finalStringParts.length === 0) return null;

        const finalStringToSave = finalStringParts.join(' - ');
        const existingEntry = box.entries && box.entries.length > 0 ? box.entries[0] : null;

        if (existingEntry && existingEntry.value === finalStringToSave) return null;

        if (existingEntry) {
          return axios.put(`/scoreboxes/entry/${existingEntry.id}`, {
            userId, value: finalStringToSave
          });
        } else {
          return axios.post('/scoreboxes/entry', {
            userId, scoreBoxId: box.id, value: finalStringToSave
          });
        }
      }).filter(p => p !== null); 

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        showAlert("¡Marcas actualizadas correctamente! 🏆", "success");
      }
      
      onClose();

    } catch (error) {
      console.error(error);
      showAlert("Hubo un error al guardar los resultados.", "error");
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
                              {/* 👇 CAMBIO: type="text" y placeholder más genérico */}
                              <input 
                                type="text" 
                                placeholder="Escribir..." 
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