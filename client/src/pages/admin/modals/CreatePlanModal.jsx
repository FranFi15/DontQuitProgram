import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { X, Info } from 'lucide-react';
import './CreatePlanModal.css';

function CreatePlanModal({ onClose, onSuccess, planToEdit }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  
  // Estado para las categorías
  const [planTypes, setPlanTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Observamos la duración para mostrar el cálculo en tiempo real
  const durationValue = watch("duration");

  // 1. Cargar Categorías al montar
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get('/plan-types');
        setPlanTypes(res.data);
      } catch (error) {
        console.error("Error cargando categorías");
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // 2. Cargar datos si es Edición
  useEffect(() => {
    if (planToEdit) {
      setValue('title', planToEdit.title);
      setValue('price', planToEdit.price);
      setValue('internationalPrice', planToEdit.internationalPrice); 
      setValue('transferDiscount', planToEdit.transferDiscount);
      setValue('duration', planToEdit.duration);
      setValue('description', planToEdit.description);
      setValue('planTypeId', planToEdit.planTypeId); 
      setValue('hasFollowUp', planToEdit.hasFollowUp); 
    }
  }, [planToEdit, setValue]);

  const onSubmit = async (data) => {
    // Formatear datos para el backend
    const payload = {
      ...data,
      price: parseFloat(data.price),
      internationalPrice: parseFloat(data.internationalPrice || 0),
      transferDiscount: parseInt(data.transferDiscount || 0),
      duration: parseInt(data.duration),
      planTypeId: parseInt(data.planTypeId),
      hasFollowUp: data.hasFollowUp // Boolean
    };

    try {
      if (planToEdit) {
        await axios.put(`/plans/${planToEdit.id}`, payload);
        alert('✅ Plan actualizado con éxito');
      } else {
        await axios.post('/plans', payload);
        alert('✅ Plan creado con éxito');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el plan. Verifica que hayas elegido una categoría.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter">
        <div className="modal-header">
          <h2>{planToEdit ? 'Editar Plan' : 'Nuevo Plan'}</h2>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          <div className="form-section-container">
            
            {/* 1. CATEGORÍA */}
            <div className="form-group-input">
              <label>Categoría / Tipo de Plan</label>
              <select 
                {...register("planTypeId", { required: true })} 
                className="modal-input"
                disabled={loadingTypes}
              >
                <option value="">Seleccionar Categoría...</option>
                {planTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {errors.planTypeId && <span className="error-text">La categoría es obligatoria</span>}
            </div>

            {/* 2. TÍTULO */}
            <div className="form-group-input">
              <label>Nombre del Plan</label>
              <input 
                {...register("title", { required: true })} 
                className="modal-input"
                placeholder="Ej: Crossfit Avanzado - Mes 1"
              />
              {errors.title && <span className="error-text">Requerido</span>}
            </div>

            {/* 3. PRECIOS (ARS y USD) */}
            <div className="form-row-prices">
              <div className="form-group-input">
                <label>Precio ARS ($)</label>
                <input 
                  type="number" step="0.01"
                  {...register("price", { required: true })} 
                  className="modal-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group-input">
                <label>Precio USD (u$d)</label>
                <input 
                  type="number" step="0.01"
                  {...register("internationalPrice")} 
                  className="modal-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group-input">
                <label>Descuento Transf. (%)</label>
                <input 
                  type="number" min="0" max="100"
                  {...register("transferDiscount")} 
                  className="modal-input"
                  placeholder="Ej: 10"
                />
              </div>
            </div>

            {/* 4. DURACIÓN */}
            <div className="form-group-input">
              <label>Duración del Plan (Semanas)</label>
              <input 
                type="number" 
                {...register("duration", { required: true, min: 1 })} 
                className="modal-input"
                placeholder="Ej: 4"
              />
              {/* Helper Text */}
              <div className="helper-box">
                <Info size={14} />
                <span>
                   El alumno tendrá acceso por <strong>{parseInt(durationValue || 0) + 2} semanas</strong> en total (Plan + 2 semanas extra).
                </span>
              </div>
            </div>

            {/* 5. CHECKBOX SEGUIMIENTO */}
            <div className="form-group-checkbox full-width">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  {...register("hasFollowUp")} 
                />
                <div className="checkbox-text">
                  <span className="cb-title">Incluye Seguimiento (Chat)</span>
                  <span className="cb-desc">Habilita el chat con el coach. Consume cupos de seguimiento.</span>
                </div>
              </label>
            </div>

            {/* 6. DESCRIPCIÓN */}
            <div className="form-group-input full-width">
              <label>Descripción Corta</label>
              <textarea 
                {...register("description")} 
                className="modal-input textarea"
                placeholder="Breve descripción para el alumno..."
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn">
               {planToEdit ? 'Actualizar' : 'Guardar Plan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreatePlanModal;