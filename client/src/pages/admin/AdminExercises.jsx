import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { Search, Plus, Edit3, Trash2, ExternalLink, Dumbbell } from 'lucide-react';
import CreateExerciseModal from './modals/CreateExerciseModal';
import './AdminExercises.css'; 

function AdminExercises() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);

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
      // 👈 3. ALERTA SI FALLA LA CARGA
      showAlert("Error al cargar el glosario de ejercicios.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    // Mantenemos confirm() nativo
    if(!window.confirm(`¿Seguro que deseas eliminar "${name}" del glosario?`)) return;
    try {
      await axios.delete(`/exercises/${id}`);
      fetchExercises();
      // 👈 4. ALERTA DE ÉXITO
      showAlert("Ejercicio eliminado correctamente.", "success");
    } catch (error) {
      // 👈 5. ALERTA DE ERROR
      showAlert("Error al eliminar el ejercicio.", "error");
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
                    <button className="action-btn delete" onClick={() => handleDelete(ex.id, ex.name)}>
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
    </div>
  );
}

export default AdminExercises;