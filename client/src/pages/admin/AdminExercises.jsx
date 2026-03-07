import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; 
import { Search, Plus, Edit3, Trash2, ExternalLink, Dumbbell, AlertCircle } from 'lucide-react'; // 👈 Importamos AlertCircle para el modal
import CreateExerciseModal from './modals/CreateExerciseModal';
import './AdminExercises.css'; 

function AdminExercises() {
  const { showAlert } = useAlert(); 
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);

  // 👈 NUEVO: Estado para el modal de eliminación
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  useEffect(() => {
    fetchExercises();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await axios.get('/exercises');
      setExercises(res.data);
    } catch (error) {
      console.error(error);
      showAlert("Error al cargar el glosario de ejercicios.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE BORRADO ACTUALIZADA ---
  
  // 1. Solo abre el modal
  const handleDeleteClick = (ex) => {
    setExerciseToDelete(ex);
  };

  // 2. Ejecuta el borrado
  const executeDelete = async () => {
    if(!exerciseToDelete) return;

    try {
      await axios.delete(`/exercises/${exerciseToDelete.id}`);
      fetchExercises();
      showAlert("Ejercicio eliminado del glosario.", "success");
    } catch (error) {
      showAlert("Error al eliminar el ejercicio.", "error");
    } finally {
      setExerciseToDelete(null); // Cerramos el modal
    }
  };

  const handleEdit = (ex) => {
    setExerciseToEdit(ex);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setExerciseToEdit(null);
    setIsModalOpen(true);
  };

  const filtered = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-container">Cargando glosario...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Glosario de Ejercicios ({exercises.length})</h1>
        <button className="new-btn" onClick={handleCreate}>
          <Plus size={18} /> Agregar Ejercicio
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar ejercicio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Video</th>
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="4" className="empty-msg">No hay ejercicios cargados.</td></tr>
            ) : (
              filtered.map((ex) => (
                <tr key={ex.id}>
                  <td className="fw-bold">
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div className="icon-box"><Dumbbell size={14}/></div>
                      {ex.name}
                    </div>
                  </td>
                  
                  <td className="desc-cell">
                    {ex.description ? ex.description : <span className="text-gray">-</span>}
                  </td>

                  <td>
                    {ex.videoUrl ? (
                      <a 
                        href={ex.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="video-link"
                      >
                        <ExternalLink size={14} /> Ver Video
                      </a>
                    ) : (
                      <span className="text-gray">Sin video</span>
                    )}
                  </td>

                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => handleEdit(ex)}>
                      <Edit3 size={16} />
                    </button>
                    {/* 👈 BOTÓN DE ELIMINAR ACTUALIZADO */}
                    <button className="action-btn delete" onClick={() => handleDeleteClick(ex)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateExerciseModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchExercises}
          exerciseToEdit={exerciseToEdit}
        />
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      {exerciseToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <AlertCircle size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: '#111', lineHeight: '1.2' }}>
              ¿Eliminar "{exerciseToDelete.name}"?
            </h2>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setExerciseToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Sí, Eliminar Ejercicio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminExercises;