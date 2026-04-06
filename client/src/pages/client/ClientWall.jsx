import { useState, useEffect, useRef } from 'react'; // 👈 Agregamos useRef
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; 
import { MessageSquare, Send, Users, Pin, Activity } from 'lucide-react';
import './ClientWall.css';

function ClientWall() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); 
  
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  const textareaRef = useRef(null); // 👇 REF para el auto-resize

  // 1. Efecto para auto-ajustar el alto del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // 2. Marcar muro como visto apenas entra o cambia de pestaña
  useEffect(() => {
    if (user?.id && selectedPlanId) {
      // Avisamos al backend para borrar el punto rojo de notificaciones
      axios.put('/wall/seen', { userId: user.id })
        .catch(err => console.error("Error al marcar muro como visto", err));
    }
  }, [user, selectedPlanId]);

  useEffect(() => {
    if (!user) return;
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`/workouts/my-plans/${user.id}`);
        setPlans(res.data);
        if (res.data.length > 0) {
          setSelectedPlanId(res.data[0].planId);
        }
      } catch (error) {
        console.error("Error cargando planes", error);
        showAlert("Error al cargar tus planes.", "error");
      }
    };
    fetchPlans();
  }, [user, showAlert]);

  useEffect(() => {
    if (!selectedPlanId) return;
    fetchPosts();
  }, [selectedPlanId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`/wall/${selectedPlanId}`);
      setPosts(res.data);
      if (user?.id) {
      await axios.put('/wall/seen', { userId: user.id });
    }
    } catch (error) {
      console.error(error);
      showAlert("Error al cargar los mensajes del muro.", "error");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('/wall', {
        planId: selectedPlanId,
        userId: user.id,
        content: newMessage
      });
      setNewMessage("");
      fetchPosts(); 
    } catch (error) {
      console.error(error);
      showAlert("Error al enviar el mensaje.", "error");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  const pinnedPost = posts.find(p => p.isPinned);

  return (
    <div className="wall-page-container">
      
      <div className="wall-page-header">
        <div>
          <h1>Muro del Equipo</h1>
          <p>Interactúa con compañeros de tu mismo plan.</p>
        </div>
        <Users size={32} className="wall-header-icon"/>
      </div>

      {plans.length === 0 ? (
        <div className="wall-empty-plans">
          <p>No tienes planes activos para ver el muro.</p>
        </div>
      ) : (
        <>
          <div className="wall-tabs-container">
            {plans.map(plan => (
              <button
                key={plan.planId}
                onClick={() => setSelectedPlanId(plan.planId)}
                className={`wall-tab-pill ${selectedPlanId === plan.planId ? 'wall-active' : ''}`}
              >
                {plan.planName}
              </button>
            ))}
          </div>

          <div className="wall-chat-container">
            
            {pinnedPost && (
              <div className="client-pinned-banner animate-enter">
                <div className="client-pinned-icon">
                  <Pin size={20} fill="currentColor" />
                </div>
                <div className="client-pinned-content">
                  <span className="client-pinned-title">Mensaje de la Coach</span>
                  <p className="client-pinned-text">{pinnedPost.content}</p>
                </div>
              </div>
            )}

            <div className="wall-messages-area">
              {loadingPosts ? (
                <p className="wall-loading-txt">Cargando comentarios...</p>
              ) : posts.length === 0 ? (
                <div className="wall-empty-state">
                  <MessageSquare size={40} />
                  <h3>Muro vacío</h3>
                  <p>¡Escribe el primer mensaje para el equipo!</p>
                </div>
              ) : (
                posts.map(post => {
                  const isCoach = post.user.role === 'ADMIN'; 
                  return (
                    <div key={post.id} className={`wall-bubble-row ${post.userId === user.id ? 'wall-mine' : 'wall-theirs'}`}>
                      
                      {post.userId !== user.id && (
                        <div className={`wall-avatar-circle ${isCoach ? 'wall-coach-avatar' : ''}`}>
                          {post.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className={`wall-bubble ${isCoach ? 'wall-coach-bubble' : ''}`}>
                        {post.userId !== user.id && (
                          <div className="wall-bubble-author">
                              {post.user.name}
                              {isCoach && <span className="wall-coach-badge">COACH</span>}
                          </div>
                        )}
                        <p className="wall-bubble-text">{post.content}</p>
                        <span className="wall-bubble-time">{formatTime(post.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="wall-input-wrapper">
              <form onSubmit={handleSend} className="wall-chat-form">
                {/* 👇 CAMBIO: Usamos Textarea con Ref para crecimiento automático */}
                <textarea
                  ref={textareaRef}
                  rows="1"
                  placeholder="Escribe algo al equipo..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="wall-textarea-input"
                />
                <button type="submit" disabled={!newMessage.trim()} className="wall-send-btn">
                  <Send size={20} />
                </button>
              </form>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default ClientWall;