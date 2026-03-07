import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { Plus, Trash2, Edit3, Save, X, AlertCircle } from 'lucide-react'; // 👈 Importamos AlertCircle para el modal
import './AdminScoreBoxManager.css';

function AdminScoreBoxManager({ planId }) {
  const { showAlert } = useAlert(); 
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para crear nuevo
  const [newName, setNewName] = useState('');
  const [newUnitInput, setNewUnitInput] = useState(''); 
  const [newUnitsList, setNewUnitsList] = useState([]); 

  // Estado para editar existente
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUnitInput, setEditUnitInput] = useState('');
  const [editUnitsList, setEditUnitsList] = useState([]);

  // 👈 NUEVO: Estado para el modal de eliminación
  const [boxToDelete, setBoxToDelete] = useState(null);

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/scoreboxes/plan/${planId}`);
      setBoxes(res.data);
    } catch (error) {
      console.error(error);
      showAlert("Error al cargar las métricas del plan.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) fetchBoxes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // --- MANEJO DE UNIDADES ---
  const handleAddUnit = (e) => {
    e.preventDefault();
    if (newUnitInput.trim() !== '') {
      setNewUnitsList([...newUnitsList, newUnitInput.trim().toUpperCase()]);
      setNewUnitInput('');
    }
  };

  const removeUnit = (index) => {
    setNewUnitsList(newUnitsList.filter((_, i) => i !== index));
  };

  // --- CREAR ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName || newUnitsList.length === 0) {
      return showAlert("Ingresa un nombre y al menos una unidad de medida.", "error");
    }
    try {
      await axios.post('/scoreboxes/definition', {
        planId,
        name: newName,
        measureUnit: newUnitsList.join(',') 
      });
      setNewName('');
      setNewUnitsList([]);
      fetchBoxes();
      showAlert("Métrica creada correctamente.", "success");
    } catch (error) {
      showAlert("Error al crear la métrica.", "error");
    }
  };

  // --- BORRAR (Lógica Actualizada para el Modal) ---
  
  // 1. Función que solo abre el modal
  const handleDeleteClick = (box) => {
    setBoxToDelete(box);
  };

  // 2. Función que ejecuta el borrado real
  const executeDelete = async () => {
    if (!boxToDelete) return;
    try {
      await axios.delete(`/scoreboxes/definition/${boxToDelete.id}`);
      fetchBoxes();
      showAlert("Métrica eliminada.", "success");
    } catch (error) {
      showAlert("Error al intentar borrar la métrica.", "error");
    } finally {
      setBoxToDelete(null); // Siempre cerramos el modal
    }
  };

  // --- EDICIÓN ---
  const startEdit = (box) => {
    setEditingId(box.id);
    setEditName(box.name);
    setEditUnitsList(box.measureUnit ? box.measureUnit.split(',') : []);
    setEditUnitInput('');
  };

  const handleEditAddUnit = (e) => {
    e.preventDefault();
    if (editUnitInput.trim() !== '') {
      setEditUnitsList([...editUnitsList, editUnitInput.trim().toUpperCase()]);
      setEditUnitInput('');
    }
  };

  const editRemoveUnit = (index) => {
    setEditUnitsList(editUnitsList.filter((_, i) => i !== index));
  };

  const saveEdit = async () => {
    if (!editName || editUnitsList.length === 0) {
      return showAlert("El nombre y al menos una unidad son obligatorios.", "error");
    }
    try {
      await axios.put(`/scoreboxes/definition/${editingId}`, {
        name: editName,
        measureUnit: editUnitsList.join(',') 
      });
      setEditingId(null);
      fetchBoxes();
      showAlert("Métrica actualizada.", "success");
    } catch (error) {
      showAlert("Error al editar la métrica.", "error");
    }
  };

  return (
    <div className="admin-sb-manager">
      <h4>Métricas del ScoreBox</h4>
      <p className="sb-desc">Define qué deben medir tus alumnos en este plan y las unidades permitidas.</p>

      {/* FORMULARIO DE AGREGAR */}
      <form onSubmit={handleAddSubmit} className="sb-add-form-container">
        <div className="sb-add-row">
          <input 
            type="text" 
            placeholder="Nombre de la prueba (ej: Test Cooper)" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="sb-input flex-2"
          />
          
          <div className="sb-unit-adder">
            <input 
              type="text" 
              placeholder="Unidad (ej: KG)" 
              value={newUnitInput}
              onChange={e => setNewUnitInput(e.target.value)}
              className="sb-input short"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUnit(e);
                }
              }}
            />
            <button type="button" onClick={handleAddUnit} className="sb-btn-secondary">
              <Plus size={16}/>
            </button>
          </div>

          <button type="submit" className="sb-add-btn">
            Guardar Prueba
          </button>
        </div>

        {newUnitsList.length > 0 && (
          <div className="sb-unit-chips">
            <span className="chips-label">Unidades a guardar:</span>
            {newUnitsList.map((unit, index) => (
              <span key={index} className="unit-chip">
                {unit} 
                <button type="button" onClick={() => removeUnit(index)}><X size={12}/></button>
              </span>
            ))}
          </div>
        )}
      </form>

      {/* LISTA DE CAJAS */}
      <div className="sb-list">
        {loading ? <p>Cargando...</p> : boxes.map(box => {
          const unitsArray = box.measureUnit ? box.measureUnit.split(',') : [];

          return (
            <div key={box.id} className="sb-row">
              {editingId === box.id ? (
                <div className="sb-edit-mode-vertical">
                  <div className="sb-edit-inputs">
                    <input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      placeholder="Nombre de prueba"
                      className="sb-input"
                    />
                    <div className="sb-unit-adder">
                      <input 
                        value={editUnitInput} 
                        onChange={e => setEditUnitInput(e.target.value)} 
                        placeholder="Agregar unidad"
                        className="sb-input short"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEditAddUnit(e);
                          }
                        }}
                      />
                      <button type="button" onClick={handleEditAddUnit} className="sb-btn-secondary">
                        <Plus size={16}/>
                      </button>
                    </div>
                  </div>

                  <div className="sb-unit-chips">
                    {editUnitsList.map((unit, index) => (
                      <span key={index} className="unit-chip">
                        {unit} 
                        <button type="button" onClick={() => editRemoveUnit(index)}><X size={12}/></button>
                      </span>
                    ))}
                  </div>

                  <div className="sb-edit-actions">
                    <button onClick={saveEdit} className="icon-btn save"><Save size={16}/></button>
                    <button onClick={() => setEditingId(null)} className="icon-btn cancel"><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sb-info">
                    <span className="name">{box.name}</span>
                    <div className="unit-tags">
                      {unitsArray.map((u, i) => (
                        <span key={i} className="unit-badge">{u}</span>
                      ))}
                    </div>
                  </div>
                  <div className="sb-actions">
                    <button onClick={() => startEdit(box)} className="icon-btn edit"><Edit3 size={16}/></button>
                    {/* 👈 BOTÓN DE ELIMINAR ACTUALIZADO */}
                    <button onClick={() => handleDeleteClick(box)} className="icon-btn delete"><Trash2 size={16}/></button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {boxes.length === 0 && !loading && <p className="empty-txt">No hay métricas definidas.</p>}
      </div>

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      {boxToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <AlertCircle size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: '#111', lineHeight: '1.2' }}>
              ¿Eliminar "{boxToDelete.name}"?
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>
              Esta acción es irreversible. <br/>
              Si eliminás esta métrica, <strong>se borrarán todos los registros históricos</strong> que los alumnos hayan guardado para esta prueba.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setBoxToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Sí, Eliminar Métrica
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminScoreBoxManager;