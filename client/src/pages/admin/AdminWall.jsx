import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext'; 
import { useAlert } from '../../context/AlertContext'; 
import { MessageSquare, Send, Users, Trash2, Pin, PinOff } from 'lucide-react';
import './AdminWall.css';

function AdminWall() {
  const { user } = useAuth(); 
  const { showAlert } = useAlert(); 
  
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 👇 NUEVO ESTADO PARA EL MODAL DE ELIMINAR 👇
  const [postToDelete, setPostToDelete] = useState(null); 

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        axios.put('/wall/approve-all').catch(err => console.error("Error limpiando notificaciones del muro:", err));
        const res = await axios.get('/plans'); 
        const activePlans = res.data.filter(p => p.isActive !== false); 
        setPlans(activePlans);
        if (activePlans.length > 0) setSelectedPlanId(activePlans[0].id);
      } catch (error) {
        console.error("Error cargando planes", error);
        showAlert("Error al cargar la lista de planes del muro.", "error");
      }
    };
    fetchPlans();
  }, [showAlert]);

  useEffect(() => {
    if (!selectedPlanId) return;
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`/wall/${selectedPlanId}`);
      setPosts(res.data);
    } catch (error) {
      console.error(error);
      showAlert("No se pudieron cargar los mensajes de este muro.", "error");
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
      showAlert("Error al enviar el mensaje al muro.", "error");
    }
  };

  // 👇 AHORA SOLO ABRE EL MODAL 👇
  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
  };

  // 👇 ESTA FUNCIÓN EJECUTA EL BORRADO REAL 👇
  const executeDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await axios.delete(`/wall/${postToDelete}`);
      showAlert("Mensaje eliminado.", "success");
      fetchPosts();
    } catch (error) {
      console.error(error);
      showAlert("Error al eliminar el mensaje.", "error");
    } finally {
      setPostToDelete(null); // Cerramos el modal
    }
  };

  const handlePinPost = async (postId) => {
    try {
      await axios.put(`/wall/${postId}/pin`);
      fetchPosts();
    } catch (error) {
      console.error(error);
      showAlert("Error al modificar el mensaje fijado.", "error");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  const pinnedPost = posts.find(p => p.isPinned);

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

          <div className="admin-chat-box">
            
            {pinnedPost && (
              <div className="pinned-banner animate-enter">
                <div className="pinned-icon-box">
                  <Pin size={18} fill="currentColor" />
                </div>
                <div className="pinned-content">
                  <span className="pinned-title">Mensaje Fijado</span>
                  <p className="pinned-text">{pinnedPost.content}</p>
                </div>
                <button className="unpin-btn" onClick={() => handlePinPost(pinnedPost.id)} title="Desfijar">
                  <PinOff size={18} />
                </button>
              </div>
            )}

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
                    
                    {post.userId !== user.id && (
                      <div className="avatar-circle user-avatar">
                        {post.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="bubble-wrapper">
                      <div className={`chat-bubble ${post.userId === user.id ? 'admin-bubble' : ''}`}>
                        {post.userId !== user.id && (
                          <div className="bubble-author">
                             {post.user.name}
                          </div>
                        )}
                        <p className="bubble-text">{post.content}</p>
                        <span className="bubble-time">{formatTime(post.createdAt)}</span>
                      </div>
                      
                      <div className="bubble-actions">
                        <button 
                          className={`action-bubble-btn ${post.isPinned ? 'pinned-active' : ''}`} 
                          onClick={() => handlePinPost(post.id)}
                          title={post.isPinned ? "Desfijar" : "Fijar mensaje"}
                        >
                          <Pin size={14} />
                        </button>
                        <button 
                          className="action-bubble-btn delete" 
                          onClick={() => handleDeleteClick(post.id)} /* 👇 LLAMA A LA NUEVA FUNCIÓN 👇 */
                          title="Eliminar mensaje"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

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

      {/* 👇 ACÁ ESTÁ TU MODAL DE ELIMINAR HERMOSO 👇 */}
      {postToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center', width: '90%' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={50} />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#111' }}>
              ¿Eliminar este mensaje?
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>
              Esta acción es irreversible. El mensaje desaparecerá permanentemente del muro para todos los alumnos.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setPostToDelete(null)} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600', flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDeletePost} 
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600', flex: 1 }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminWall;