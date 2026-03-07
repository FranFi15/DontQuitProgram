import { useEffect, useState, useCallback } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; 
import { CreditCard, Plus, Trash2, Calendar, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import CreateSubscriptionModal from './modals/CreateSubscriptionModal';
import './AdminUsers.css';

function AdminSubscriptions() {
  const { showAlert } = useAlert(); 
  const [subs, setSubs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState(null);

  // 👈 NUEVO: Estado para el modal de eliminación
  const [subToDelete, setSubToDelete] = useState(null);

  const fetchSubs = useCallback(async () => {
    try {
      const res = await axios.get('/subscriptions');
      setSubs(res.data);
    } catch (error) {
      console.error(error);
      showAlert("Error al cargar las suscripciones activas.", "error");
    }
  }, [showAlert]); 

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]); 

  const handleCreate = () => {
    setSubToEdit(null); 
    setIsModalOpen(true);
  };
  
  const handleEdit = (sub) => {
    setSubToEdit(sub); 
    setIsModalOpen(true);
  };

  // 👈 1. Solo abre el modal
  const handleDeleteClick = (sub) => {
    setSubToDelete(sub);
  };

  // 👈 2. Ejecuta el borrado cuando Rocío confirma
  const executeDelete = async () => {
    if (!subToDelete) return;

    try {
      await axios.delete(`/subscriptions/${subToDelete.id}`);
      fetchSubs(); 
      showAlert("Suscripción cancelada correctamente.", "success");
    } catch (error) {
      showAlert("Error al cancelar la suscripción.", "error");
    } finally {
      setSubToDelete(null); // Cerramos siempre el modal
    }
  };

  // Función visual para fechas
  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h1 className="users-title">Suscripciones Activas</h1>
        <button className="new-user-btn" onClick={handleCreate}>
          <Plus size={18} /> Asignar Plan
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Plan</th>
              <th>Inicio</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th style={{textAlign:'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-gray">No hay suscripciones activas.</td></tr>
            ) : (
              subs.map((sub) => {
                const expired = isExpired(sub.endDate);
                return (
                  <tr key={sub.id}>
                    <td className="fw-bold">{sub.user?.name}</td>
                    <td>
                      <span className="role-badge" style={{backgroundColor:'#f3f4f6', color:'#000'}}>
                        {sub.plan?.title}
                      </span>
                    </td>
                    <td className="text-gray">{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td className="text-gray" style={{color: expired ? 'red' : 'green'}}>
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td>
                      {expired ? (
                        <span style={{color:'red', display:'flex', alignItems:'center', gap:4, fontSize:'0.85rem', fontWeight:'bold'}}>
                          <AlertCircle size={14}/> Vencido
                        </span>
                      ) : (
                        <span style={{color:'green', display:'flex', alignItems:'center', gap:4, fontSize:'0.85rem', fontWeight:'bold'}}>
                          <CheckCircle size={14}/> Activo
                        </span>
                      )}
                    </td>
                    <td className="actions-cell">
                      {/* BOTÓN EDITAR */}
                      <button className="action-btn edit" onClick={() => handleEdit(sub)} title="Editar Plan/Fecha">
                        <Edit3 size={16} />
                      </button>
                      
                      {/* 👈 BOTÓN ELIMINAR ACTUALIZADO */}
                      <button className="action-btn delete" onClick={() => handleDeleteClick(sub)} title="Cancelar acceso">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateSubscriptionModal 
          subToEdit={subToEdit} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchSubs}
        />
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE CANCELACIÓN --- */}
      {subToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <AlertCircle size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: '#111', lineHeight: '1.2' }}>
              ¿Cancelar Suscripción?
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>
              Estás por revocarle el acceso al plan <strong>"{subToDelete.plan?.title}"</strong> al alumno <strong>{subToDelete.user?.name}</strong>.
              <br/><br/>
              Si confirmás, dejará de ver sus rutinas y métricas inmediatamente.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setSubToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' }}
              >
                Volver
              </button>
              <button 
                onClick={executeDelete} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Sí, Cancelar Acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubscriptions;