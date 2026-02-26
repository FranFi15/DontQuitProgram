import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext'; 
import { MessageSquare, Send, Users } from 'lucide-react';
import './AdminWall.css';

function AdminWall() {
  const { user } = useAuth(); // Este user es el Admin
  
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 1. Cargar TODOS los planes activos (Endpoint de Admin)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // --- NUEVO: Limpiamos los posteos pendientes del Muro en segundo plano ---
        // (Asegúrate de que la ruta coincida con tu backend, ej: router.put('/approve-all', ...))
        axios.put('/wall/approve-all').catch(err => console.error("Error limpiando notificaciones del muro:", err));

        // --- TU CÓDIGO ORIGINAL ---
        const res = await axios.get('/plans'); // Endpoint que trae todos los planes
        const activePlans = res.data.filter(p => p.isActive !== false); 
        setPlans(activePlans);
        
        if (activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
        }
      } catch (error) {
        console.error("Error cargando planes", error);
      }
    };
    fetchPlans();
  }, []);

  // 2. Cargar Mensajes del Plan seleccionado
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
        userId: user.id, // ID del Admin
        content: newMessage
      });
      setNewMessage("");
      fetchPosts(); 
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  return (
    <div className="admin-wall-container">
      
      {/* HEADER */}
      <div className="admin-wall-header">
        <div>
          <h1>Muro </h1>
          <p>Envía mensajes y avisos a los atletas de cada plan.</p>
        </div>
        <Users size={32} className="header-icon-admin"/>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state-admin">
          <p>No hay planes creados aún.</p>
        </div>
      ) : (
        <>
          {/* TABS DE PLANES */}
          <div className="wall-tabs-container">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`wall-tab-pill ${selectedPlanId === plan.id ? 'active' : ''}`}
              >
                {plan.title}
              </button>
            ))}
          </div>

          {/* CHAT CONTAINER */}
          <div className="admin-chat-box">
            
            <div className="messages-area">
              {loadingPosts ? (
                <p className="loading-txt">Cargando...</p>
              ) : posts.length === 0 ? (
                <div className="empty-chat-state">
                  <MessageSquare size={40} />
                  <p>Muro vacío. Escribe un mensaje de bienvenida.</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className={`chat-bubble-row ${post.userId === user.id ? 'mine' : 'theirs'}`}>
                    
                    {/* AVATAR (Para los atletas) */}
                    {post.userId !== user.id && (
                      <div className="avatar-circle user-avatar">
                        {post.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className={`chat-bubble ${post.userId === user.id ? 'admin-bubble' : ''}`}>
                      {/* Nombre */}
                      {post.userId !== user.id && (
                        <div className="bubble-author">
                           {post.user.name}
                        </div>
                      )}
                      
                      <p className="bubble-text">{post.content}</p>
                      <span className="bubble-time">{formatTime(post.createdAt)}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* INPUT AREA */}
            <div className="chat-input-wrapper">
              <form onSubmit={handleSend} className="chat-form">
                <input
                  type="text"
                  placeholder={`Escribe como COACH en ${plans.find(p=>p.id === selectedPlanId)?.title}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()} className="send-btn-admin">
                  <Send size={18} />
                </button>
              </form>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default AdminWall;