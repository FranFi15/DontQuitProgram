import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { X, Calculator, Save } from 'lucide-react';
import './RMCalculatorModal.css';

function RMCalculatorModal({ userId, onClose, onSuccess }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  
  // Input de TEXTO LIBRE 
  const [exercise, setExercise] = useState(''); 
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [previewRM, setPreviewRM] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cálculo en tiempo real (Fórmula Brzycki)
  useEffect(() => {
    if (weight && reps) {
      const w = parseFloat(weight);
      const r = parseInt(reps);
      // Evitar división por cero o negativos
      if (r === 1) {
        setPreviewRM(w);
      } else {
        const res = w / (1.0278 - (0.0278 * r));
        setPreviewRM(res > 0 ? Math.round(res) : w);
      }
    } else {
      setPreviewRM(null);
    }
  }, [weight, reps]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!exercise || !weight || !reps) return;
    
    setSaving(true);
    try {
      await axios.post('/records', {
        userId,
        exercise, 
        weight,
        reps
      });
      
      // 👈 3. ALERTA DE ÉXITO (Opcional, pero queda bien como feedback)
      showAlert("¡Nuevo récord guardado!", "success");
      
      onSuccess(); // Recargar la lista en el Home
      onClose();   // Cerrar modal
    } catch (error) {
      console.error(error);
      // 👈 4. ALERTA DE ERROR GLOBAL
      showAlert("Error al guardar el récord. Inténtalo de nuevo.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-bottom animate-slide-up">
        
        <div className="modal-header">
          <h3>Nuevo Récord</h3>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        <form onSubmit={handleSave} className="rm-form">
          
          <div className="input-group full-width">
            <label>Nombre del Ejercicio</label>
            <input 
              type="text" 
              placeholder="Ej: Press Militar con Mancuernas" 
              value={exercise} 
              onChange={e => setExercise(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="row-inputs">
            <div className="input-group">
              <label>Peso (kg)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={weight} 
                onChange={e => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Reps</label>
              <input 
                type="number" 
                placeholder="0" 
                value={reps} 
                onChange={e => setReps(e.target.value)}
                required
              />
            </div>
          </div>

          {/* PREVIEW DEL CÁLCULO */}
          <div className="preview-box">
            <div className="preview-label">
              <Calculator size={16}/> 1RM Estimado (Teórico)
            </div>
            <div className="preview-value">
              {previewRM ? `${previewRM} KG` : '--'}
            </div>
          </div>

          <button type="submit" className="save-rm-btn" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Progreso'} <Save size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default RMCalculatorModal;