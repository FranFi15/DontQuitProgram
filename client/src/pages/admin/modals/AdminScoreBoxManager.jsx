import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import './AdminScoreBoxManager.css';

function AdminScoreBoxManager({ planId }) {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para crear nuevo
  const [newName, setNewName] = useState('');
  const [newUnitInput, setNewUnitInput] = useState(''); // Lo que está escribiendo
  const [newUnitsList, setNewUnitsList] = useState([]); // Lista de unidades agregadas

  // Estado para editar existente
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUnitInput, setEditUnitInput] = useState('');
  const [editUnitsList, setEditUnitsList] = useState([]);

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/scoreboxes/plan/${planId}`);
      setBoxes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) fetchBoxes();
  }, [planId]);

  // --- MANEJO DE UNIDADES (CREAR) ---
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
      return alert("Ingresa un nombre y al menos una unidad de medida.");
    }
    try {
      await axios.post('/scoreboxes/definition', {
        planId,
        name: newName,
        measureUnit: newUnitsList.join(',') // Guardamos como "KG,REPS,SEG"
      });
      setNewName('');
      setNewUnitsList([]);
      fetchBoxes();
    } catch (error) {
      alert("Error al crear");
    }
  };

  // --- BORRAR ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro? Se borrarán los registros de los alumnos asociados a esta métrica.")) return;
    try {
      await axios.delete(`/scoreboxes/definition/${id}`);
      fetchBoxes();
    } catch (error) {
      alert("Error al borrar");
    }
  };

  // --- INICIAR EDICIÓN ---
  const startEdit = (box) => {
    setEditingId(box.id);
    setEditName(box.name);
    // Convertimos el string guardado ("KG,REPS") de vuelta a array
    setEditUnitsList(box.measureUnit ? box.measureUnit.split(',') : []);
    setEditUnitInput('');
  };

  // --- MANEJO DE UNIDADES (EDITAR) ---
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

  // --- GUARDAR EDICIÓN ---
  const saveEdit = async () => {
    if (!editName || editUnitsList.length === 0) {
      return alert("El nombre y al menos una unidad son obligatorios.");
    }
    try {
      await axios.put(`/scoreboxes/definition/${editingId}`, {
        name: editName,
        measureUnit: editUnitsList.join(',') // Guardamos el array como string
      });
      setEditingId(null);
      fetchBoxes();
    } catch (error) {
      alert("Error al editar");
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
              onKeyPress={(e) => {
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

        {/* Visualizador de etiquetas (chips) para las unidades agregadas */}
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
          // Extraemos las unidades para mostrarlas visualmente
          const unitsArray = box.measureUnit ? box.measureUnit.split(',') : [];

          return (
            <div key={box.id} className="sb-row">
              {editingId === box.id ? (
                // MODO EDICIÓN
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
                        onKeyPress={(e) => {
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
                // MODO VISUALIZACIÓN
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
                    <button onClick={() => handleDelete(box.id)} className="icon-btn delete"><Trash2 size={16}/></button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {boxes.length === 0 && !loading && <p className="empty-txt">No hay métricas definidas.</p>}
      </div>
    </div>
  );
}

export default AdminScoreBoxManager;