import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Search, Play, Dumbbell } from 'lucide-react';
import './ClientGlossary.css';

function ClientGlossary() {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await axios.get('/exercises'); // Asegúrate de que esta ruta sea pública o accesible para clientes
        setExercises(res.data);
      } catch (error) {
        console.error("Error cargando el glosario", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  // Filtrado por nombre o grupo muscular (si lo tienes)
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="glossary-container">
      <div className="glossary-header">
        <h1>Glosario de Ejercicios</h1>
        <p>Aprende la técnica correcta de los movimientos de tus rutinas.</p>
      </div>

      <div className="glossary-search-bar">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar ejercicio (ej. Sentadilla, Pull up...)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="glossary-loading">Cargando ejercicios...</div>
      ) : (
        <div className="glossary-grid">
          {filteredExercises.length === 0 ? (
            <div className="glossary-empty">No se encontraron ejercicios con ese nombre.</div>
          ) : (
            filteredExercises.map((ex) => (
              <div key={ex.id} className="exercise-card">
                
                {/* Si tienes miniaturas de video o imágenes, irían aquí. Usamos un placeholder por ahora */}
                <div className="exercise-media-placeholder">
                  {ex.videoUrl ? (
                    <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="play-btn-link">
                      <Play size={32} fill="white" />
                    </a>
                  ) : (
                    <Dumbbell size={40} color="#9ca3af" />
                  )}
                </div>

                <div className="exercise-info">
                  <h3>{ex.name}</h3>
                  {ex.muscleGroup && <span className="muscle-tag">{ex.muscleGroup}</span>}
                  <p>{ex.description || "Sin descripción detallada."}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ClientGlossary;