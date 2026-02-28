import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, Save } from 'lucide-react';
import './CreateCategoryModal.css';

function CreateCategoryModal({ onClose, onSuccess, categoryToEdit }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
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
        // 👈 3. ALERTA DE ACTUALIZACIÓN
        showAlert('Categoría actualizada correctamente', 'success');
      } else {
        await axios.post(`/plan-types`, data);
        // 👈 4. ALERTA DE CREACIÓN
        showAlert('Nueva categoría creada', 'success');
      }
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        // 👈 5. ALERTA DE ERROR ESPECÍFICO (Ej: nombre duplicado)
        showAlert(error.response.data.error, "error");
      } else {
        // 👈 6. ALERTA DE ERROR GENÉRICO
        showAlert('Error al intentar guardar la categoría', 'error');
      }
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
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