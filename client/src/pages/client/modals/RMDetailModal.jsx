import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { X, Edit3, Trash2, Save, ArrowLeft, Percent } from 'lucide-react';
import './RMDetailModal.css';

function RMDetailModal({ record, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para edición
  const [exercise, setExercise] = useState(record.exercise);
  const [weight, setWeight] = useState(record.weight);
  const [reps, setReps] = useState(record.reps);
  const [saving, setSaving] = useState(false);

  // Generar tabla de porcentajes basada en el 1RM actual
  const oneRM = record.oneRM;
  const percentages = [105, 100, 95, 90, 85, 80, 75, 70, 60, 50];

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/records/${record.id}`, {
        exercise,
        weight,
        reps
      });
      onUpdate(); // Recargar datos en Home
      onClose();
    } catch (error) {
      alert("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if(!confirm("¿Borrar este récord?")) return;
    try {
      await axios.delete(`/records/${record.id}`);
      onUpdate();
      onClose();
    } catch (error) {
      alert("Error al borrar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-bottom animate-slide-up">
        
        {/* HEADER */}
        <div className="detail-modal-header">
          {isEditing ? (
            <button onClick={() => setIsEditing(false)} className="icon-action-btn">
              <ArrowLeft size={24}/>
            </button>
          ) : (
            <div className="header-actions">
              <button onClick={handleDelete} className="icon-action-btn delete">
                <Trash2 size={20}/>
              </button>
            </div>
          )}
          
          <h3 className="modal-title">{isEditing ? "Editar RM" : record.exercise}</h3>
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="icon-action-btn edit">
              <Edit3 size={20}/>
            </button>
          )}
          {isEditing && <div style={{width: 24}}></div>} {/* Espaciador */}
        </div>

        {/* CONTENIDO */}
        {isEditing ? (
          // --- MODO EDICIÓN ---
          <form onSubmit={handleUpdate} className="rm-form">
            <div className="input-group full-width">
              <label>Nombre</label>
              <input value={exercise} onChange={e => setExercise(e.target.value)} required />
            </div>
            <div className="row-inputs">
              <div className="input-group">
                <label>Peso (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Reps</label>
                <input type="number" value={reps} onChange={e => setReps(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="save-rm-btn" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"} <Save size={18}/>
            </button>
          </form>

        ) : (
          // --- MODO VISUALIZACIÓN (PORCENTAJES) ---
          <div className="percentages-view">
            
            {/* Héroe: 1RM */}
            <div className="one-rm-hero-compact">
              <div className="hero-left">
                 <span className="hero-label">TU 1RM TEÓRICO</span>
                 <span className="hero-sub">Basado en {record.weight}kg x {record.reps}</span>
              </div>
              <div className="hero-right">
                 <span className="hero-value">{Math.round(oneRM)} <small>KG</small></span>
              </div>
            </div>

            <h4 className="list-title"><Percent size={14}/> Tabla de Cargas</h4>
            
            {/* NUEVA LISTA VERTICAL */}
            <div className="percentages-list-container">
              {percentages.map(pct => (
                <div key={pct} className={`pct-row ${pct === 100 ? 'row-100' : ''}`}>
                  <div className="pct-badge">{pct}%</div>
                  <div className="pct-line"></div>
                  <div className="pct-weight-val">
                    {Math.round(oneRM * (pct / 100))} <small>kg</small>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="close-detail-btn">Cerrar</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default RMDetailModal;