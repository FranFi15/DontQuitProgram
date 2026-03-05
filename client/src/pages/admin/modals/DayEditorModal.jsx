import { useState } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Plus, Trash2, Save, X, Edit3 } from 'lucide-react';
import './DayEditorModal.css';

function DayEditorModal({ workout, onClose, onSuccess }) {
  const { showAlert } = useAlert(); 
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(workout.title || '');

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

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

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

  const handleSave = async () => {
    setLoading(true);
    
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
      
      showAlert("Rutina guardada correctamente.", "success");
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      showAlert("Hubo un problema al guardar la rutina.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dem-overlay">
      <div className="dem-content dem-animate-enter">
        
        {/* HEADER */}
        <div className="dem-header">
          <div className="dem-header-info">
            <span className="dem-header-meta">SEMANA {workout.weekNumber} - {workout.title}</span>
            <input 
              className="dem-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del Día (Ej: Pierna Hipertrofia)"
            />
          </div>
          <button onClick={onClose} className="dem-close-btn"><X size={24}/></button>
        </div>

        <div className="dem-scroll-area">
          
          {/* ESTADO VACÍO (SIN BLOQUES) */}
          {blocks.length === 0 && (
            <div className="dem-empty-state">
              <div className="dem-empty-icon">📝</div>
              <p>No hay bloques creados para este día.</p>
              <button onClick={addBlock} className="dem-add-block-large">
                <Plus size={20}/> Agregar Primer Bloque
              </button>
            </div>
          )}

          {/* LISTA DE BLOQUES */}
          <div className="dem-blocks-list">
            {blocks.map((block, index) => (
              <div key={index} className="dem-workout-block animate-enter">
                
                <div className="dem-block-header">
                  <div className="dem-block-title-wrapper">
                    <Edit3 size={16} className="dem-edit-icon"/>
                    <input 
                      className="dem-block-title-input"
                      value={block.title}
                      onChange={(e) => updateBlockTitle(index, e.target.value)}
                      placeholder={`Nombre del Bloque (Ej: Sentadilla)`}
                    />
                  </div>
                  <button onClick={() => removeBlock(index)} className="dem-delete-btn" title="Eliminar bloque">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="dem-editor-container">
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

          {/* BOTÓN INFERIOR PARA AGREGAR MÁS BLOQUES */}
          {blocks.length > 0 && (
            <div className="dem-add-footer-centered">
              <button onClick={addBlock} className="dem-add-block-footer">
                <Plus size={18} /> Agregar Nuevo Bloque
              </button>
            </div>
          )}

        </div>

        {/* FOOTER GENERAL */}
        <div className="dem-footer-actions">
           <button onClick={onClose} className="dem-cancel-btn">Cancelar</button>
           <button onClick={handleSave} className="dem-save-btn" disabled={loading}>
             <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Rutina'}
           </button>
        </div>

      </div>
    </div>
  );
}

export default DayEditorModal;