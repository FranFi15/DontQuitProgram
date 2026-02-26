import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { X, Save, Search } from 'lucide-react';
import './CreateUserModal.css'; 

function CreateSubscriptionModal({ onClose, onSuccess, subToEdit }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  // Datos originales del backend
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  // Búsqueda de Usuarios
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Búsqueda de Planes
  const [planSearch, setPlanSearch] = useState('');
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Referencias para cerrar los dropdowns al hacer clic fuera
  const userRef = useRef(null);
  const planRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, plansRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/plans')
        ]);
        setUsers(usersRes.data);
        setPlans(plansRes.data);

        // Si estamos editando, pre-seleccionamos los datos
        if (subToEdit) {
          setValue('userId', subToEdit.userId); 
          setValue('planId', subToEdit.planId); 
          
          const foundUser = usersRes.data.find(u => u.id === subToEdit.userId);
          const foundPlan = plansRes.data.find(p => p.id === subToEdit.planId);
          
          if(foundUser) {
              setSelectedUser(foundUser);
              setUserSearch(`${foundUser.name} (${foundUser.email})`);
          }
          if(foundPlan) {
              setSelectedPlan(foundPlan);
              setPlanSearch(`${foundPlan.title} - ${foundPlan.duration} Semanas`);
          }
          
          if (subToEdit.startDate) {
            setValue('startDate', subToEdit.startDate.split('T')[0]);
          }
        }
      } catch (error) {
        console.error("Error cargando listas", error);
      }
    };
    fetchData();

    // Event listener para cerrar los dropdowns al hacer clic fuera
    const handleClickOutside = (event) => {
        if (userRef.current && !userRef.current.contains(event.target)) setShowUserDropdown(false);
        if (planRef.current && !planRef.current.contains(event.target)) setShowPlanDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [subToEdit, setValue]);

  // Filtrado reactivo basado en lo que el usuario escribe
  const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPlans = plans.filter(p => 
      p.title.toLowerCase().includes(planSearch.toLowerCase())
  );

  // Funciones de selección
  const handleSelectUser = (user) => {
      setSelectedUser(user);
      setUserSearch(`${user.name} (${user.email})`);
      setValue('userId', user.id); // Guardamos el ID en react-hook-form
      setShowUserDropdown(false);
  };

  const handleSelectPlan = (plan) => {
      setSelectedPlan(plan);
      setPlanSearch(`${plan.title} - ${plan.duration} Semanas`);
      setValue('planId', plan.id); // Guardamos el ID en react-hook-form
      setShowPlanDropdown(false);
  };

  const onSubmit = async (data) => {
    // Validación manual de los selectores personalizados
    if (!selectedUser) return alert("Por favor selecciona un alumno de la lista.");
    if (!selectedPlan) return alert("Por favor selecciona un plan de la lista.");

    const payload = {
        userId: selectedUser.id,
        planId: selectedPlan.id,
        startDate: data.startDate
    };

    try {
      if (subToEdit) {
        // En edición, a veces solo se actualiza el plan y la fecha
        await axios.put(`/subscriptions/${subToEdit.id}`, payload);
        alert('Suscripción actualizada');
      } else {
        await axios.post('/subscriptions', payload);
        alert('Suscripción asignada correctamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error al procesar la solicitud');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter" style={{ maxWidth: '500px', overflow: 'visible' }}>
        <div className="modal-header">
          <h2>{subToEdit ? 'Editar Suscripción' : 'Asignar Plan Manual'}</h2>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          {/* BUSCADOR DE ALUMNO */}
          <div className="form-group" ref={userRef} style={{ position: 'relative' }}>
            <label>Alumno</label>
            <div className="search-input-wrapper">
                <Search size={16} className="search-input-icon" />
                <input 
                    type="text"
                    className="modal-input"
                    placeholder="Escribe para buscar alumno..."
                    value={userSearch}
                    onChange={(e) => {
                        setUserSearch(e.target.value);
                        setSelectedUser(null); // Resetea selección si edita el texto
                        setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    disabled={!!subToEdit} // Bloqueado si edita
                    style={{ paddingLeft: '35px', backgroundColor: subToEdit ? '#f3f4f6' : 'white' }}
                />
            </div>
            
            {showUserDropdown && !subToEdit && (
                <ul className="custom-dropdown">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <li key={u.id} onClick={() => handleSelectUser(u)}>
                                <strong>{u.name}</strong> <span style={{fontSize:'0.8rem', color:'#6b7280'}}>- {u.email}</span>
                            </li>
                        ))
                    ) : (
                        <li className="no-results">No se encontraron alumnos</li>
                    )}
                </ul>
            )}
          </div>

          {/* BUSCADOR DE PLAN */}
          <div className="form-group" ref={planRef} style={{ position: 'relative' }}>
            <label>Plan de Entrenamiento</label>
            <div className="search-input-wrapper">
                <Search size={16} className="search-input-icon" />
                <input 
                    type="text"
                    className="modal-input"
                    placeholder="Escribe para buscar plan..."
                    value={planSearch}
                    onChange={(e) => {
                        setPlanSearch(e.target.value);
                        setSelectedPlan(null); 
                        setShowPlanDropdown(true);
                    }}
                    onFocus={() => setShowPlanDropdown(true)}
                    style={{ paddingLeft: '35px' }}
                />
            </div>

            {showPlanDropdown && (
                <ul className="custom-dropdown">
                    {filteredPlans.length > 0 ? (
                        filteredPlans.map(p => (
                            <li key={p.id} onClick={() => handleSelectPlan(p)}>
                                <strong>{p.title}</strong> 
                                <span className="dropdown-badge">{p.duration} Semanas</span>
                            </li>
                        ))
                    ) : (
                        <li className="no-results">No se encontraron planes</li>
                    )}
                </ul>
            )}
          </div>

          {/* FECHA DE INICIO */}
          <div className="form-group">
            <label>Fecha de Inicio</label>
            <input 
              type="date" 
              defaultValue={new Date().toISOString().split('T')[0]} 
              {...register("startDate")} 
              className="modal-input"
            />
            <small style={{color:'#6b7280', display: 'block', marginTop: '5px'}}>
              {subToEdit ? "Al cambiar esto, se recalculará el vencimiento." : "El vencimiento se calcula solo (Semanas + 2 extra)."}
            </small>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn">
              <Save size={18} style={{marginRight:'6px'}}/> {subToEdit ? 'Guardar Cambios' : 'Asignar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateSubscriptionModal;