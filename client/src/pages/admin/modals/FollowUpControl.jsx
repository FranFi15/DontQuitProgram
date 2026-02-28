import { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext'; 
import { Settings, Save, Users, AlertCircle } from 'lucide-react';
import './FollowUpControl.css'; 

function FollowUpControl() {
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const [stats, setStats] = useState({ used: 0, limit: 50 });
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/settings/followup-stats');
      setStats(res.data);
      setNewLimit(res.data.limit);
    } catch (error) {
      console.error("Error cargando stats de seguimiento", error);
      // 👈 3. ALERTA DE ERROR AL CARGAR
      showAlert("No se pudieron cargar las métricas de cupos.", "error");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/settings/followup-limit', { newLimit: parseInt(newLimit) });
      await fetchStats(); 
      setIsEditing(false);
      // 👈 4. ALERTA DE ÉXITO
      showAlert("Límite de seguimiento actualizado correctamente", "success");
    } catch (error) {
      // 👈 5. ALERTA DE ERROR AL GUARDAR
      showAlert("Error al intentar guardar el nuevo límite.", "error");
    } finally {
      setLoading(false);
    }
  };

  const percentage = Math.min((stats.used / stats.limit) * 100, 100);
  const isCritical = percentage >= 90; 

  return (
    <div className="followup-card">
      <div className="followup-header">
        <div className="title-area">
          <Users size={20} className="icon-users"/>
          <h3>Cupos de Seguimiento (Chat)</h3>
        </div>
        
        {!isEditing ? (
          <button className="btn-config" onClick={() => setIsEditing(true)}>
             <Settings size={16} /> Configurar Límite
          </button>
        ) : (
          <div className="edit-controls">
            <input 
              type="number" 
              value={newLimit} 
              onChange={(e) => setNewLimit(e.target.value)}
              className="limit-input"
              min="0"
            />
            <button className="btn-save-limit" onClick={handleSave} disabled={loading}>
              <Save size={16} />
            </button>
            <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancelar</button>
          </div>
        )}
      </div>

      <div className="stats-row">
        <span className="big-number">{stats.used}</span>
        <span className="label-text">Alumnos Activos</span>
        <span className="separator">/</span>
        <span className="limit-number">{stats.limit} Máximo</span>
      </div>

      <div className="progress-bar-container">
        <div 
          className={`progress-fill ${isCritical ? 'critical' : 'normal'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {stats.used >= stats.limit && (
        <div className="alert-message">
          <AlertCircle size={16} /> 
          <span>¡Límite alcanzado! Los planes con seguimiento aparecerán SIN STOCK a nuevos clientes.</span>
        </div>
      )}
    </div>
  );
}

export default FollowUpControl;