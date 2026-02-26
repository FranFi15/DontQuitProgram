import { useEffect, useState, useCallback } from 'react';
import axios from '../../api/axios';
import { CreditCard, Plus, Trash2, Calendar, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import CreateSubscriptionModal from './modals/CreateSubscriptionModal';
import './AdminUsers.css';

function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState(null);


  const fetchSubs = useCallback(async () => {
    try {
      const res = await axios.get('/subscriptions');
      setSubs(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

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

  const handleCancel = async (id) => {
    if(!window.confirm('¿Cancelar esta suscripción? El alumno perderá acceso inmediato.')) return;
    try {
      await axios.delete(`/subscriptions/${id}`);
      fetchSubs(); 
    } catch (error) {
      alert('Error al cancelar');
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
                    <td className="text-gray" style={{color: expired ? 'red' : 'inherit'}}>
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
                      
                      {/* BOTÓN ELIMINAR */}
                      <button className="action-btn delete" onClick={() => handleCancel(sub.id)} title="Cancelar acceso">
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
    </div>
  );
}

export default AdminSubscriptions;