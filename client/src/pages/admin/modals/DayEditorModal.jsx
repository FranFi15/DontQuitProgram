import { useState } from 'react';
import axios from '../../../api/axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Plus, Trash2, Save, X, Edit3 } from 'lucide-react';
import './DayEditorModal.css';

function DayEditorModal({ workout, onClose, onSuccess }) {
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

  // 2. CONFIGURACIÓN DE LA BARRA (Tus preferencias: colores, titulos, etc)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }], // Colores habilitados
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
        title: `Bloque ${nextNum}`, // Título por defecto
        content: '' // HTML vacío
      }
    ]);
  };

  const removeBlock = (index) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  // Editar el Título del Bloque (Input libre)
  const updateBlockTitle = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].title = value;
    setBlocks(newBlocks);
  };

  // Editar el Contenido (Quill)
  const updateBlockContent = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = value;
    setBlocks(newBlocks);
  };

  // --- GUARDAR ---
  const handleSave = async () => {
    setLoading(true);
    
    // Limpieza: Si el título quedó vacío, le ponemos un default
    const cleanBlocks = blocks.map((b, i) => ({
      title: b.title.trim() === '' ? `Bloque ${i + 1}` : b.title,
      content: b.content
    }));

    try {
      // Endpoint Upsert
      await axios.post(`/workouts/${workout.planId}`, {
        planId: workout.planId,
        weekNumber: workout.weekNumber,
        dayNumber: workout.dayNumber,
        title: title,
        blocks: cleanBlocks // Enviamos array, el back lo stringifia
      });
      
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      alert("Error al guardar la rutina");
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
                
                {/* CABECERA DEL BLOQUE (Título editable) */}
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

                {/* EDITOR DE TEXTO ENRIQUECIDO */}
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