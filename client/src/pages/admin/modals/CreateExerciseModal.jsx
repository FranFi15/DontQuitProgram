import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, Save, Video, FileText } from 'lucide-react';
import './CreateUserModal.css'; 

function CreateExerciseModal({ onClose, onSuccess, exerciseToEdit }) {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (exerciseToEdit) {
      setValue('name', exerciseToEdit.name);
      setValue('videoUrl', exerciseToEdit.videoUrl);
      setValue('description', exerciseToEdit.description);
    }
  }, [exerciseToEdit, setValue]);

  const onSubmit = async (data) => {
    try {
      if (exerciseToEdit) {
        await axios.put(`/exercises/${exerciseToEdit.id}`, data);
        // 👈 3. ALERTA DE ACTUALIZACIÓN
        showAlert('Ejercicio actualizado correctamente', 'success');
      } else {
        await axios.post('/exercises', data);
        // 👈 4. ALERTA DE CREACIÓN
        showAlert('Nuevo ejercicio creado', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // 👈 5. ALERTA DE ERROR
      showAlert(error.response?.data?.error || 'Error al guardar el ejercicio', 'error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{exerciseToEdit ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          {/* NOMBRE */}
          <div className="form-group">
            <label>Nombre del Ejercicio</label>
            <input 
              {...register("name", { required: true })} 
              className="modal-input" 
              placeholder="Ej: Sentadilla Trasera (Back Squat)"
              autoFocus
            />
            {errors.name && <span className="error-text">El nombre es obligatorio</span>}
          </div>

          {/* VIDEO URL */}
          <div className="form-group">
            <label style={{display:'flex', alignItems:'center', gap:5}}>
              <Video size={14}/> Link del Video (YouTube / Drive)
            </label>
            <input 
              {...register("videoUrl", { required: true })} 
              className="modal-input"
              placeholder="https://youtube.com/..."
            />
            {errors.videoUrl && <span className="error-text">El link del video es obligatorio</span>}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="form-group">
            <label style={{display:'flex', alignItems:'center', gap:5}}>
              <FileText size={14}/> Descripción / Tips
            </label>
            <textarea 
              {...register("description")} 
              className="modal-input"
              placeholder="Ej: Mantener la espalda recta, romper el paralelo..."
              rows={4}
              style={{resize: 'vertical'}}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn">
              <Save size={18} /> Guardar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateExerciseModal;