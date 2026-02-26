import { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { X, UserX, Calendar } from 'lucide-react';
import './PlanStudentsModal.css';

function PlanStudentsModal({ plan, onClose, onUpdate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plan) {
      fetchStudents();
    }
  }, [plan]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`/subscriptions/plan/${plan.id}`);
      setStudents(res.data);
    } catch (error) {
      console.error("Error al cargar alumnos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!window.confirm('¿Seguro que deseas cancelar la suscripción de este alumno? Perderá el acceso al plan.')) return;
    
    try {
      await axios.delete(`/subscriptions/${subId}`);
      alert('Suscripción cancelada');
      fetchStudents();
      onUpdate(); // Actualiza el conteo en la pantalla principal
    } catch (error) {
      console.error(error);
      alert('Error al cancelar suscripción');
    }
  };

  return (
    <div className="ps-modal-overlay">
      <div className="ps-modal-content animate-enter">
        <div className="ps-modal-header">
          <div>
             <span className="ps-plan-badge">ALUMNOS DEL PLAN</span>
             <h2>{plan.title}</h2>
          </div>
          <button onClick={onClose} className="ps-close-btn"><X size={24}/></button>
        </div>

        <div className="ps-modal-body">
          {loading ? (
            <div className="ps-loading">Cargando alumnos...</div>
          ) : students.length === 0 ? (
            <div className="ps-empty">No hay alumnos activos en este plan actualmente.</div>
          ) : (
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Vencimiento</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {students.map((sub) => (
                  <tr key={sub.id}>
                    <td className="ps-name-cell">
                      <strong>{sub.user.name || "Sin nombre"}</strong>
                    </td>
                    <td className="ps-contact-cell">
                      <span>{sub.user.email}</span>
                      <span className="ps-phone">{sub.user.phone || "-"}</span>
                    </td>
                    <td className="ps-date-cell">
                      <Calendar size={14} />
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="ps-action-cell">
                      <button 
                         className="ps-btn-cancel-sub" 
                         onClick={() => handleCancelSubscription(sub.id)}
                         title="Quitar del plan"
                      >
                         <UserX size={16} /> Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanStudentsModal;