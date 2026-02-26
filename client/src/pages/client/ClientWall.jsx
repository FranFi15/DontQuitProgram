import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, Users } from 'lucide-react';
import './ClientWall.css';

function ClientWall() {
  const { user } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 1. Cargar Planes Activos al entrar
  useEffect(() => {
    if (!user) return;
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`/workouts/my-plans/${user.id}`);
        setPlans(res.data);
        // Seleccionar el primero por defecto
        if (res.data.length > 0) {
          setSelectedPlanId(res.data[0].planId);
        }
      } catch (error) {
        console.error("Error cargando planes", error);
      }
    };
    fetchPlans();
  }, [user]);

  // 2. Cargar Mensajes cuando cambia el Plan seleccionado
  useEffect(() => {
    if (!selectedPlanId) return;
    fetchPosts();
  }, [selectedPlanId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`/wall/${selectedPlanId}`);
      setPosts(res.data);
    } catch (error) {
      console.error(error);
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
      fetchPosts(); // Recargar chat
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  return (
    <div className="wall-page-container">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="wall-page-header">
        <div>
          <h1>Muro del Equipo</h1>
          <p>Interactúa con compañeros de tu mismo plan.</p>
        </div>
        <Users size={32} className="header-icon"/>
      </div>

      {plans.length === 0 ? (
        <div className="empty-plans-wall">
          <p>No tienes planes activos para ver el muro.</p>
        </div>
      ) : (
        <>
          {/* SELECTOR DE PLANES (TABS) */}
          <div className="wall-tabs-container">
            {plans.map(plan => (
              <button
                key={plan.planId}
                onClick={() => setSelectedPlanId(plan.planId)}
                className={`wall-tab-pill ${selectedPlanId === plan.planId ? 'active' : ''}`}
              >
                {plan.planName}
              </button>
            ))}
          </div>

          {/* ZONA DE CHAT */}
          <div className="chat-container">
            
            {/* LISTA DE MENSAJES */}
            <div className="messages-area">
              {loadingPosts ? (
                <p className="loading-txt">Cargando comentarios...</p>
              ) : posts.length === 0 ? (
                <div className="empty-chat-state">
                  <MessageSquare size={40} />
                  <h3>Muro vacío</h3>
                  <p>¡Escribe el primer mensaje para el equipo!</p>
                </div>
              ) : (
                posts.map(post => {
  const isCoach = post.user.role === 'ADMIN'; // <--- DETECTAMOS SI ES COACH

  return (
    <div key={post.id} className={`chat-bubble-row ${post.userId === user.id ? 'mine' : 'theirs'}`}>
      
      {/* AVATAR */}
      {post.userId !== user.id && (
        // Si es Coach mostramos un icono o inicial distinta
        <div className={`avatar-circle ${isCoach ? 'coach-avatar' : ''}`}>
          {post.user.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* BURBUJA CON CLASE CONDICIONAL */}
      <div className={`chat-bubble ${isCoach ? 'coach-bubble' : ''}`}>
        
        {/* Nombre del autor */}
        {post.userId !== user.id && (
          <div className="bubble-author">
              {post.user.name}
              {isCoach && <span className="coach-badge">COACH</span>}
          </div>
        )}
        
        <p className="bubble-text">{post.content}</p>
        <span className="bubble-time">{formatTime(post.createdAt)}</span>
      </div>

    </div>
  );
})
              )}
            </div>

            {/* INPUT FIXED ABAJO */}
            <div className="chat-input-wrapper">
              <form onSubmit={handleSend} className="chat-form">
                <input
                  type="text"
                  placeholder={`Escribe al equipo de ${plans.find(p=>p.planId === selectedPlanId)?.planName}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
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