import { useState } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Plus, Trash2, Save, X, Edit3 } from 'lucide-react';
import './DayEditorModal.css';

function DayEditorModal({ workout, onClose, onSuccess }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(workout.title || '');

  // 1. ESTADO DE LOS BLOQUES (Parseamos si viene como string JSON)
  const [blocks, setBlocks] = useState(() => {
    try {
      if (typeof workout.blocks === 'string') {
        return JSON.parse(workout.blocks);
      }
      return workout.blocks || [];
    } catch (e) {
      return [];
    }
  });

  // 2. CONFIGURACIÓN DE LA BARRA
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  // --- ACCIONES ---

  const addBlock = () => {
    const nextNum = blocks.length + 1;
    setBlocks([
      ...blocks, 
      { 
        title: `Bloque ${nextNum}`, 
        content: '' 
      }
    ]);
  };

  const removeBlock = (index) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const updateBlockTitle = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].title = value;
    setBlocks(newBlocks);
  };

  const updateBlockContent = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = value;
    setBlocks(newBlocks);
  };

  // --- GUARDAR ---
  const handleSave = async () => {
    setLoading(true);
    
    // Limpieza de títulos vacíos
    const cleanBlocks = blocks.map((b, i) => ({
      title: b.title.trim() === '' ? `Bloque ${i + 1}` : b.title,
      content: b.content
    }));

    try {
      await axios.post(`/workouts/${workout.planId}`, {
        planId: workout.planId,
        weekNumber: workout.weekNumber,
        dayNumber: workout.dayNumber,
        title: title,
        blocks: cleanBlocks 
      });
      
      // 👈 3. ALERTA DE ÉXITO
      showAlert("Rutina guardada correctamente.", "success");
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      // 👈 4. ALERTA DE ERROR
      showAlert("Hubo un problema al guardar la rutina.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal animate-enter">
        
        {/* HEADER */}
        <div className="modal-header">
          <div className="header-info" style={{width: '100%'}}>
            <span className="header-meta"> SEMANA {workout.weekNumber} -  {workout.title}</span>
            <input 
              className="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del Día (Ej: Pierna Hipertrofia)"
            />
          </div>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <div className="modal-scroll-area">
          
          {blocks.length === 0 && (
            <div className="empty-blocks-state">
              <p>No hay bloques creados para este día.</p>
              <button onClick={addBlock} className="add-block-btn-large">
                <Plus size={18}/> Agregar Primer Bloque
              </button>
            </div>
          )}

          <div className="blocks-list">
            {blocks.map((block, index) => (
              <div key={index} className="workout-block">
                
                <div className="block-header">
                  <div className="block-title-wrapper">
                    <Edit3 size={14} className="edit-icon-indicator"/>
                    <input 
                      className="block-title-input"
                      value={block.title}
                      onChange={(e) => updateBlockTitle(index, e.target.value)}
                      placeholder={`Nombre del Bloque (Ej: Sentadilla)`}
                    />
                  </div>
                  <button onClick={() => removeBlock(index)} className="delete-icon-btn">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="editor-container">
                  <ReactQuill 
                    theme="snow"
                    value={block.content}
                    onChange={(val) => updateBlockContent(index, val)}
                    modules={modules}
                    placeholder="Describe los ejercicios, series, reps..."
                  />
                </div>

              </div>
            ))}
          </div>

          {blocks.length > 0 && (
            <div className="add-section-footer-centered">
              <button onClick={addBlock} className="add-block-btn-footer">
                <Plus size={18} /> Agregar Nuevo Bloque
              </button>
            </div>
          )}

        </div>

        {/* FOOTER GENERAL */}
        <div className="modal-footer-actions">
           <button onClick={onClose} className="cancel-btn">Cancelar</button>
           <button onClick={handleSave} className="save-btn" disabled={loading}>
             <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Rutina'}
           </button>
        </div>

      </div>
    </div>
  );
}

export default DayEditorModal;