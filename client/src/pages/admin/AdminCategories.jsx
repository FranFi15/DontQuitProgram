import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; 
import { Trash2, Edit, Plus, Layers, AlertCircle } from 'lucide-react'; // 👈 Importamos AlertCircle
import CreateCategoryModal from './modals/CreateCategoryModal';
import CategoryPlansModal from './modals/CategoryPlansModal'; 
import './AdminCategories.css'; 

function AdminCategories() {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  // Estados para Modal de Ver Planes
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 👈 NUEVO: Estado para el modal de eliminación
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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
      showAlert("Error al cargar las categorías.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE BORRADO ACTUALIZADA ---

  // 1. Solo abre el modal
  const handleDeleteClick = (cat) => {
    setCategoryToDelete(cat);
  };

  // 2. Ejecuta el borrado
  const executeDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await axios.delete(`/plan-types/${categoryToDelete.id}`);
      fetchCategories(); 
      showAlert("Categoría eliminada correctamente.", "success");
    } catch (error) {
      if (error.response && error.response.status === 400) {
         showAlert(error.response.data.error, "error");
      } else {
         showAlert("Error al eliminar la categoría.", "error");
      }
    } finally {
      setCategoryToDelete(null); // Cerramos el modal
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
                      {/* 👈 BOTÓN DE ELIMINAR ACTUALIZADO */}
                      <button className="action-btn delete" onClick={() => handleDeleteClick(cat)} title="Eliminar">
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

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      {categoryToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <AlertCircle size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: '#111', lineHeight: '1.2' }}>
              ¿Eliminar "{categoryToDelete.name}"?
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>
              Esta acción borrará la categoría de la plataforma.<br/><br/>
              <strong style={{color: '#4b5563'}}>Atención:</strong> El sistema no te permitirá borrarla si aún hay planes asignados a ella.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setCategoryToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminCategories;