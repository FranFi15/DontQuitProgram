// client/src/pages/admin/AdminCategories.jsx
import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Trash2, Edit, Plus, Layers } from 'lucide-react'; // Agregamos Layers
import CreateCategoryModal from './modals/CreateCategoryModal';
import CategoryPlansModal from './modals/CategoryPlansModal'; // Importamos el nuevo modal
import './AdminCategories.css'; 

function AdminCategories() {
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
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/plan-types');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) return;
    
    try {
      await axios.delete(`/plan-types/${id}`);
      fetchCategories(); 
      alert("Categoría eliminada.");
    } catch (error) {
      if (error.response && error.response.status === 400) {
         alert("⚠️ " + error.response.data.error);
      } else {
         alert("Error al eliminar.");
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
              <th style={{textAlign: 'center'}}>Planes Asociados</th> {/* Nueva Columna */}
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
                // Obtenemos la cantidad que viene del backend (si no existe, 0)
                const planCount = cat._count?.plans || 0;

                return (
                  <tr key={cat.id}>
                    <td className="id-col">#{cat.id}</td>
                    <td className="name-col">{cat.name}</td>
                    <td className="desc-col">{cat.description || '-'}</td>
                    
                    {/* Nueva celda para mostrar la cantidad de planes */}
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