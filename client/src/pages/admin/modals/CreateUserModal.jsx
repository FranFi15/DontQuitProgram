import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../../api/axios';
import { X, Save } from 'lucide-react';
import './CreateUserModal.css'; 

function CreateUserModal({ onClose, onSuccess, userToEdit }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  
  useEffect(() => {
    if (userToEdit) {
      setValue('name', userToEdit.name); 
      setValue('email', userToEdit.email);
      setValue('role', userToEdit.role);
      // Ficha Técnica
      setValue('phone', userToEdit.phone);
      setValue('sex', userToEdit.sex);
      if (userToEdit.birthDate) {
        const formattedDate = new Date(userToEdit.birthDate).toISOString().split('T')[0];
        setValue('birthDate', formattedDate);
      }
    }
  }, [userToEdit, setValue]);

  const onSubmit = async (data) => {
    try {
      if (userToEdit) {
        // MODO EDICIÓN
        await axios.put(`/users/${userToEdit.id}`, data);
        alert('Perfil actualizado con éxito');
      } else {
        // MODO CREACIÓN
        await axios.post('/users', data);
        alert('Usuario creado correctamente');
      }
      onSuccess(); // Recargar la tabla
      onClose();   // Cerrar modal
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-enter">
        <div className="modal-header">
          <h2>{userToEdit ? 'Editar Ficha' : 'Nuevo Alumno'}</h2>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          
          {/* SECCIÓN 1: DATOS DE CUENTA */}
          <div className="form-section">
            <h3 className="section-title">Datos de Cuenta</h3>
            
            <div className="form-groupcreate">
              <label>Nombre Completo</label>
              <input 
                {...register("name", { required: true })} 
                className="modal-input" 
                placeholder="Ej: Juan Perez"
              />
              {errors.name && <span className="error-text">Requerido</span>}
            </div>

            <div className="form-row">
              <div className="form-groupcreate">
                <label>Email</label>
                <input 
                  type="email"
                  {...register("email", { required: true })} 
                  className="modal-input"
                  placeholder="juan@email.com"
                />
                {errors.email && <span className="error-text">Requerido</span>}
              </div>
              <div className="form-groupcreate">
                <label>Rol</label>
                <select {...register("role")} className="modal-input">
                  <option value="ATLETA">Atleta</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <div className="form-groupcreate">
              <label>Contraseña {userToEdit && <span style={{fontWeight:'normal', fontSize:'0.8rem'}}>(Opcional)</span>}</label>
              <input 
                type="password"
                {...register("password", { required: !userToEdit })} 
                className="modal-input"
                placeholder="******"
              />
              {errors.password && <span className="error-text">Requerido para nuevos usuarios</span>}
            </div>
          </div>

          {/* SECCIÓN 2: FICHA TÉCNICA */}
          <div className="form-section">
            <h3 className="section-title">Ficha Técnica</h3>
            
            <div className="form-row">
              <div className="form-groupcreate">
                <label>Teléfono</label>
                <input 
                  type="tel"
                  {...register("phone")} 
                  className="modal-input"
                  placeholder="Ej: 11 1234 5678"
                />
              </div>
              
              <div className="form-groupcreate">
                <label>Sexo</label>
                <select {...register("sex")} className="modal-input">
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-groupcreate">
                <label>Fecha Nacimiento</label>
                <input 
                  type="date" 
                  {...register("birthDate")} 
                  className="modal-input center-text" 
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            <button type="submit" className="save-btn">
              <Save size={18} /> {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;