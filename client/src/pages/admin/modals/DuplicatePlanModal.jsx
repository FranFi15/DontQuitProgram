import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, Copy, Info } from 'lucide-react';
import './CreatePlanModal.css'; 

function DuplicatePlanModal({ plan, onClose, onSuccess }) {
  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pre-cargamos los valores originales para que Rocío solo modifique lo necesario
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      newTitle: `${plan.title} (Copia)`,
      newPrice: plan.price,
      newInternationalPrice: plan.internationalPrice,
      newTransferDiscount: plan.transferDiscount,
      newHasFollowUp: plan.hasFollowUp
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`/plans/${plan.id}/duplicate`, data);
      showAlert('¡Plan duplicado con éxito! Las rutinas se han copiado.', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showAlert('Hubo un error al duplicar el plan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Copy size={24} color="#111" />
             <h2>Duplicar Plan</h2>
          </div>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          <div className="helper-box" style={{ marginBottom: '15px' }}>
            <Info size={18} />
            <span>
              Estás por crear una copia exacta de <strong>"{plan.title}"</strong>. <br/>
              Todas sus rutinas y semanas se copiarán automáticamente. Ajustá el nuevo nombre, precio y si tendrá seguimiento.
            </span>
          </div>

          {/* NUEVO TÍTULO */}
          <div className="form-group-input full-width">
            <label>Nuevo Título del Plan</label>
            <input 
              {...register("newTitle", { required: true })} 
              className="modal-input"
              placeholder="Ej: Plan Crossfit (Con Seguimiento)"
            />
            {errors.newTitle && <span className="error-text">El título es requerido</span>}
          </div>

          {/* PRECIOS */}
          <div className="form-row-prices">
            <div className="form-group-input">
              <label>Nuevo Precio ARS ($)</label>
              <input 
                type="number" step="0.01"
                {...register("newPrice", { required: true })} 
                className="modal-input"
              />
            </div>
            <div className="form-group-input">
              <label>Nuevo Precio USD</label>
              <input 
                type="number" step="0.01"
                {...register("newInternationalPrice")} 
                className="modal-input"
              />
            </div>
            <div className="form-group-input">
              <label>Descuento Transf. (%)</label>
              <input 
                type="number" min="0" max="100"
                {...register("newTransferDiscount")} 
                className="modal-input"
              />
            </div>
          </div>

          {/* CHECKBOX SEGUIMIENTO */}
          <div className="form-group-checkbox full-width" style={{ marginTop: '10px' }}>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                {...register("newHasFollowUp")} 
              />
              <div className="checkbox-text">
                <span className="cb-title">Este nuevo plan incluye Seguimiento (Chat)</span>
                <span className="cb-desc">Si lo marcás, consumirá cupos de seguimiento cuando se venda.</span>
              </div>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Duplicando...' : 'Confirmar Duplicación'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default DuplicatePlanModal;