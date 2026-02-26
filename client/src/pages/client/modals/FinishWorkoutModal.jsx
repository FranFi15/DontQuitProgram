import { useState } from 'react';
import axios from '../../../api/axios';
import { X, Send, Flame } from 'lucide-react';
import './FinishWorkoutModal.css';

function FinishWorkoutModal({ workoutTitle, userId, onClose, onSuccess }) {
  const [score, setScore] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!score) {
      return alert("Por favor, selecciona qué tan difícil estuvo (1 al 10).");
    }

    setLoading(true);
    try {
      const messageContent = `🏋️ Entrenamiento completado: ${workoutTitle}\n🔥 Dificultad: ${score}/10\n📝 Notas: ${notes || 'Sin comentarios adicionales.'}`;

      await axios.post('/chat', {
        senderId: userId,
        receiverId: 1, 
        content: messageContent,
        mediaType: 'TEXT'
      });

      alert("¡Entrenamiento registrado y enviado a tu coach! 💪");
      
      // ¡AQUÍ ESTÁ EL CAMBIO! Ejecutamos onSuccess en lugar de onClose
      onSuccess(); 
      
    } catch (error) {
      console.error(error);
      alert("Hubo un error al enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fw-modal-overlay">
      <div className="fw-modal-content animate-pop-in">
        
        <button className="fw-close-btn" onClick={onClose}><X size={24}/></button>

        <div className="fw-header">
          <div className="fw-icon-wrapper">
            <Flame size={32} color="#ff4500" />
          </div>
          <h2>¡Entrenamiento Terminado!</h2>
          <p>¿Qué tan intenso estuvo el {workoutTitle}?</p>
        </div>

        <div className="fw-body">
          <div className="fw-score-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button 
                key={num}
                type="button"
                className={`fw-score-btn ${score === num ? 'selected' : ''}`}
                onClick={() => setScore(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="fw-score-labels">
            <span>Muy fácil</span>
            <span>Extremo</span>
          </div>

          <div className="fw-notes-container">
            <label>Comentarios para tu coach (Opcional)</label>
            <textarea 
              placeholder="Ej: Me costó la última serie de sentadillas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <button 
            className="fw-submit-btn" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Enviando...' : <><Send size={18} /> Enviar Reporte</>}
          </button>
        </div>

      </div>
    </div>
  );
}

export default FinishWorkoutModal;