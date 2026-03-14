import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { X, Dumbbell } from 'lucide-react';
import './AdminUserScoresModal.css'; // Usamos los mismos estilos que ya tenés

function AdminUserRMsModal({ userId, userName, onClose }) {
  const { showAlert } = useAlert();
  const [rms, setRms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRMs = async () => {
      try {
        const res = await axios.get(`/users/${userId}/rms`);
        setRms(res.data);
      } catch (error) {
        console.error(error);
        showAlert("Error al cargar los RMs del usuario.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRMs();
  }, [userId, showAlert]);

  return (
    <div className="modal-overlay">
      <div className="modal-content-large animate-scale-up" style={{ maxWidth: '800px', height: 'auto', maxHeight: '80vh' }}>
        
        {/* HEADER */}
        <div className="modal-header-simple">
          <div className="header-title-box">
             <Dumbbell size={20} color='#9333ea'/>
             <h3 style={{ color: '#9333ea' }}>RMs de {userName}</h3>
             <button onClick={onClose} className="close-btn"><X size={20}/></button>
          </div>
        </div>

        {/* BODY */}
        <div className="modal-body-scroll">
          {loading ? (
            <p className="loading-txt">Cargando marcas...</p>
          ) : rms.length === 0 ? (
            <div className="empty-state-modal">
              <p>Este atleta todavía no registró ningún RM.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="users-table" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ejercicio</th>
                    <th>Peso</th>
                    <th>Reps</th>
                    <th>Estimado 1RM</th>
                  </tr>
                </thead>
                <tbody>
                  {rms.map((record) => (
                    <tr key={record.id}>
                      <td className="text-gray">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="fw-bold" style={{ textTransform: 'capitalize' }}>{record.exercise}</td>
                      <td>{record.weight} kg</td>
                      <td className="text-gray">{record.reps}</td>
                      <td className="fw-bold" style={{ color: '#9333ea' }}>{record.oneRM} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserRMsModal;