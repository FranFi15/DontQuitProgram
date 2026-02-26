import { useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- 1. IMPORTAR PORTAL
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { X, Save } from 'lucide-react';
import './CreateCategoryModal.css';

function CreateCategoryModal({ onClose, onSuccess, categoryToEdit }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (categoryToEdit) {
      setValue('name', categoryToEdit.name);
      setValue('description', categoryToEdit.description);
    }
  }, [categoryToEdit, setValue]);

  const onSubmit = async (data) => {
    try {
      if (categoryToEdit) {
        await axios.put(`/plan-types/${categoryToEdit.id}`, data);
        alert('✅ Categoría actualizada');
      } else {
        await axios.post(`/plan-types`, data);
        alert('✅ Categoría creada');
      }
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        alert("⚠️ " + error.response.data.error);
      } else {
        alert('Error al guardar la categoría');
      }
    }
  };

  // 2. ENVOLVER EL RETURN EN createPortal
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      {/* Añadimos stopPropagation para que hacer click dentro del modal no lo cierre */}
      <div 
        className="modal-content animate-enter" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <button type="button" onClick={onClose} className="close-btn">
            <X size={24}/>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          <div className="form-group-input">
            <label>Nombre de la Categoría</label>
            <input 
              {...register("name", { required: true })} 
              className="modal-input"
              placeholder="Ej: Crossfit, Running..."
            />
            {errors.name && <span className="error-text">El nombre es obligatorio</span>}
          </div>

          <div className="form-group-input">
            <label>Descripción (Opcional)</label>
            <textarea 
              {...register("description")} 
              className="modal-input textarea"
              placeholder="Breve descripción de qué trata..."
            />
          </div>

          <div className="modal-footer">
            {/* Es vital que este botón sea type="button" para que no dispare el form por error */}
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn">
              <Save size={16} style={{marginRight:5}}/> Guardar
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body 
  );
}

export default CreateCategoryModal;