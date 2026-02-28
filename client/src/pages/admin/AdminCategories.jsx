// client/src/pages/admin/AdminCategories.jsx
import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { Trash2, Edit, Plus, Layers } from 'lucide-react'; 
import CreateCategoryModal from './modals/CreateCategoryModal';
import CategoryPlansModal from './modals/CategoryPlansModal'; 
import './AdminCategories.css'; 

function AdminCategories() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  // Estados para Modal de Ver Planes
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/plan-types');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      // 👈 3. ALERTA DE ERROR AL CARGAR
      showAlert("Error al cargar las categorías.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Mantenemos el confirm nativo por seguridad
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) return;
    
    try {
      await axios.delete(`/plan-types/${id}`);
      fetchCategories(); 
      // 👈 4. ALERTA DE ÉXITO AL ELIMINAR
      showAlert("Categoría eliminada correctamente.", "success");
    } catch (error) {
      if (error.response && error.response.status === 400) {
         // 👈 5. ALERTA DEL BACKEND (Ej: "No se puede borrar porque tiene planes asociados")
         showAlert(error.response.data.error, "error");
      } else {
         // 👈 6. ALERTA DE ERROR GENÉRICO
         showAlert("Error al eliminar la categoría.", "error");
      }
    }
  };

  const openCreate = () => { setCategoryToEdit(null); setIsModalOpen(true); };
  const openEdit = (cat) => { setCategoryToEdit(cat); setIsModalOpen(true); };
  
  const openPlansModal = (cat) => {
    setSelectedCategory(cat);
    setIsPlansModalOpen(true);
  };

  if (loading) return <div className="loading-text">Cargando categorías...</div>;

  return (
    <div className="categories-page">
      
      <div className="page-header">
        <div className="header-title">
          <h1>Categorías de Planes</h1>
        </div>
        <button className="new-btn" onClick={openCreate}>
          <Plus size={18}/> Nueva Categoría
        </button>
      </div>

      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th style={{textAlign: 'center'}}>Planes Asociados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">No hay categorías creadas.</td>
              </tr>
            ) : (
              categories.map((cat) => {
                const planCount = cat._count?.plans || 0;

                return (
                  <tr key={cat.id}>
                    <td className="id-col">#{cat.id}</td>
                    <td className="name-col">{cat.name}</td>
                    <td className="desc-col">{cat.description || '-'}</td>
                    
                    <td style={{textAlign: 'center'}}>
                      <button 
                        className="btn-view-plans" 
                        onClick={() => openPlansModal(cat)}
                        disabled={planCount === 0}
                        title={planCount > 0 ? "Ver planes" : "Sin planes"}
                      >
                        <Layers size={14} style={{marginRight: '4px'}}/>
                        {planCount} {planCount === 1 ? 'Plan' : 'Planes'}
                      </button>
                    </td>

                    <td className="actions-col">
                      <button className="action-btn edit" onClick={() => openEdit(cat)} title="Editar">
                        <Edit size={16}/>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(cat.id)} title="Eliminar">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateCategoryModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchCategories}
          categoryToEdit={categoryToEdit}
        />
      )}

      {isPlansModalOpen && selectedCategory && (
        <CategoryPlansModal 
          category={selectedCategory}
          onClose={() => setIsPlansModalOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminCategories;