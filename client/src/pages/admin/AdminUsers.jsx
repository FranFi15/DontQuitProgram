import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; 
import { Search, UserPlus, Edit3, Trash2, ClipboardList, History } from 'lucide-react';
import CreateUserModal from './modals/CreateUserModal';
import AdminUserScoresModal from '../admin/modals/AdminUserScoresModal';
import UserSubscriptionsModal from './modals/UserSubscriptionsModal';
import './AdminUsers.css';

function AdminUsers() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const [showScoresModal, setShowScoresModal] = useState(false);
  const [selectedScoreUser, setSelectedScoreUser] = useState(null);

  const [userToDelete, setUserToDelete] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);

  // Carga inicial
  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      // 👈 3. ALERTA SI FALLA LA CARGA
      showAlert("Error al cargar la lista de atletas.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Abrir Modal Crear
  const handleCreate = () => {
    setUserToEdit(null); 
    setIsModalOpen(true);
  };

  // Abrir Modal Editar
  const handleEdit = (user) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleViewScores = (user) => {
    setSelectedScoreUser(user);
    setShowScoresModal(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const handleViewHistory = (user) => {
    setSelectedHistoryUser(user);
    setShowHistoryModal(true);
  };

  // 2. Función que EJECUTA el borrado (se llama desde el modal)
  const executeDelete = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`/users/${userToDelete.id}`);
      fetchUsers();
      showAlert(`La cuenta de ${userToDelete.name} ha sido eliminada.`, "success");
    } catch (error) {
      console.error(error);
      showAlert("Error al intentar eliminar al usuario.", "error");
    } finally {
      setUserToDelete(null); 
    }
  };

  // Filtrado Frontend
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const emailMatch = u.email?.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  if (loading) return <div className="users-container">Cargando atletas...</div>;

  return (
    <div className="users-container">
      {/* HEADER */}
      <div className="users-header">
        <h1 className="users-title">Atletas ({users.length})</h1>
        <button className="new-user-btn" onClick={handleCreate}>
          <UserPlus size={18} /> Nuevo Atleta
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="users-toolbar">
        <div className="search-bar-users">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre y Plan</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Fecha Nacimiento</th>
              <th>Sexo</th>
              <th>Estado</th>
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  {users.length === 0 ? "No hay atletas registrados." : "No se encontraron coincidencias."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  {/* NOMBRE Y PLAN */}
                  <td>
                    <div className="user-info-cell">
                      <span className="fw-bold">{user.name || "Sin Nombre"}</span>
                      {user.subscriptionStatus === 'ACTIVO' && (
                        <span className="plan-tag">{user.planName}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="text-gray">{user.email}</td>
                  <td className="text-gray">{user.phone || "-"}</td>
                  <td className="text-gray">{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "-"}</td>
                  <td className="text-gray">{user.sex || "-"}</td>

                  {/* ESTADO DE SUSCRIPCIÓN */}
                  <td>
                    {user.subscriptionStatus === 'ACTIVO' ? (
                      <span className="status-badge status-active">
                        ● Al Día
                      </span>
                    ) : (
                      <span className="status-badge status-inactive">
                        ● Inactivo
                      </span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="actions-cell">
                    <button 
                      className="action-btn scores" 
                      onClick={() => handleViewScores(user)}
                      title="Ver Métricas "
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button 
                      className="action-btn history" 
                      onClick={() => handleViewHistory(user)}
                      title="Ver Historial de Planes"
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                    >
                      <History size={16} />
                    </button>
                    <button 
                      className="action-btn edit" 
                      onClick={() => handleEdit(user)} 
                      title="Editar Ficha"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDeleteClick(user)}
                      title="Eliminar Cuenta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      {isModalOpen && (
        <CreateUserModal 
          userToEdit={userToEdit} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchUsers} 
        />
      )}

      {showScoresModal && selectedScoreUser && (
         <AdminUserScoresModal 
            userId={selectedScoreUser.id}
            userName={selectedScoreUser.name}
            onClose={() => {
              setShowScoresModal(false);
              setSelectedScoreUser(null);
            }} 
         />
       )}
       {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#111' }}>
              ¿Eliminar a {userToDelete.name}?
            </h2>
            
            {userToDelete.subscriptionStatus === 'ACTIVO' ? (
              <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '25px', lineHeight: '1.5' }}>
                ⚠️ ¡CUIDADO! Este alumno tiene el "{userToDelete.planName}" ACTIVO.<br/><br/>
                Si lo eliminás, perderá el acceso inmediatamente y se borrarán todos sus pagos e historial.
              </p>
            ) : (
              <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>
                Esta acción es irreversible. Se borrarán todos los datos y el historial de este usuario.
              </p>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setUserToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Sí, Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && selectedHistoryUser && (
        <UserSubscriptionsModal 
          userId={selectedHistoryUser.id}
          userName={selectedHistoryUser.name}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedHistoryUser(null);
          }} 
        />
      )}
    </div>
  );
}

export default AdminUsers;