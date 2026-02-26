import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Search, UserPlus, Edit3, Trash2, ClipboardList } from 'lucide-react';
import CreateUserModal from './modals/CreateUserModal';
import AdminUserScoresModal from '../admin/modals/AdminUserScoresModal';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

const [showScoresModal, setShowScoresModal] = useState(false);
  const [selectedScoreUser, setSelectedScoreUser] = useState(null);

  // Carga inicial
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
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

  // Eliminar (Soft Delete de la cuenta)
  const handleDelete = async (id, name) => {
    if(!window.confirm(`¿Estás segura de eliminar la cuenta de "${name}"?`)) return;

    try {
      await axios.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el usuario");
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
                <td colSpan="5" className="text-center py-4 text-gray-500">
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
                      className="action-btn edit" 
                      onClick={() => handleEdit(user)} 
                      title="Editar Ficha"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDelete(user.id, user.name)} 
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

      {/* MODAL */}
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
    </div>
  );
}

export default AdminUsers;