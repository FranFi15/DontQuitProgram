import { useState, useEffect, useRef } from 'react';
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
  const [postToDelete, setPostToDelete] = useState(null); 

  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // 1. CARGA DE PLANES CON BADGES
  const fetchPlans = async () => {
    try {
      // Usamos la ruta que trae el pendingCount por cada plan
      const res = await axios.get('/wall/admin/plans-badges'); 
      const activePlans = res.data; 
      setPlans(activePlans);
      
      // Si es la primera vez que carga, seleccionamos el primero
      if (activePlans.length > 0 && !selectedPlanId) {
        handleSelectPlan(activePlans[0].id, activePlans);
      }
    } catch (error) {
      console.error("Error cargando planes", error);
    }
  };

  // 2. FUNCIÓN PARA SELECCIONAR PLAN Y LIMPIAR SU BADGE
  const handleSelectPlan = async (planId, currentPlans = plans) => {
    setSelectedPlanId(planId);
    
    // Buscamos si ese plan tiene mensajes pendientes
    const plan = currentPlans.find(p => p.id === planId);
    
    if (plan && plan.pendingCount > 0) {
      try {
        // Aprobamos solo los mensajes de ESTE plan
        await axios.put(`/wall/approve-plan/${planId}`);
        
        // Actualizamos el estado local para borrar el punto rojo al instante
        setPlans(prev => prev.map(p => 
          p.id === planId ? { ...p, pendingCount: 0 } : p
        ));
      } catch (err) {
        console.error("Error al aprobar mensajes del plan", err);
      }
    }
  };

  useEffect(() => {
    fetchPlans();
    // Polling cada 30 segundos para que Ro vea si entran mensajes nuevos en otros muros
    const interval = setInterval(fetchPlans, 30000);
    return () => clearInterval(interval);
  }, [selectedPlanId]); // Dependencia mínima para no loopear

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
      showAlert("No se pudieron cargar los mensajes.", "error");
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

  const handleDeleteClick = (postId) => setPostToDelete(postId);

  const executeDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await axios.delete(`/wall/${postToDelete}`);
      showAlert("Mensaje eliminado.", "success");
      fetchPosts();
    } catch (error) {
      console.error(error);
      showAlert("Error al eliminar.", "error");
    } finally {
      setPostToDelete(null);
    }
  };

  const handlePinPost = async (postId) => {
    try {
      await axios.put(`/wall/${postId}/pin`);
      fetchPosts();
    } catch (error) {
      console.error(error);
      showAlert("Error al modificar el fijado.", "error");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  const pinnedPost = posts.find(p => p.isPinned);

  return (
    <div className="admin-wall-container">
      <div className="admin-wall-header">
        <div>
          <h1>Muro</h1>
          <p>Envía mensajes y avisos a los atletas de cada plan.</p>
        </div>
        <Users size={32} className="header-icon-admin"/>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state-admin"><p>No hay planes creados aún.</p></div>
      ) : (
        <>
          <div className="wall-tabs-container">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                // 👇 CLASE DINÁMICA para resaltar si hay pendientes
                className={`wall-tab-pill ${selectedPlanId === plan.id ? 'active' : ''} ${plan.pendingCount > 0 ? 'has-pending' : ''}`}
              >
                {plan.title}
                {/* 👇 PUNTO ROJO si hay mensajes nuevos */}
                {plan.pendingCount > 0 && <span className="admin-wall-dot" />}
              </button>
            ))}
          </div>

          <div className="admin-chat-box">
            {pinnedPost && (
              <div className="pinned-banner animate-enter">
                <div className="pinned-icon-box"><Pin size={18} fill="currentColor" /></div>
                <div className="pinned-content">
                  <span className="pinned-title">Mensaje Fijado</span>
                  <p className="pinned-text">{pinnedPost.content}</p>
                </div>
                <button className="unpin-btn" onClick={() => handlePinPost(pinnedPost.id)}><PinOff size={18} /></button>
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
                      <div className="avatar-circle user-avatar">{post.user.name.charAt(0).toUpperCase()}</div>
                    )}
                    <div className="bubble-wrapper">
                      <div className={`chat-bubble ${post.userId === user.id ? 'admin-bubble' : ''}`}>
                        {post.userId !== user.id && <div className="bubble-author">{post.user.name}</div>}
                        <p className="bubble-text">{post.content}</p>
                        <span className="bubble-time">{formatTime(post.createdAt)}</span>
                      </div>
                      <div className="bubble-actions">
                        <button className={`action-bubble-btn ${post.isPinned ? 'pinned-active' : ''}`} onClick={() => handlePinPost(post.id)}><Pin size={14} /></button>
                        <button className="action-bubble-btn delete" onClick={() => handleDeleteClick(post.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input-wrapper">
              <form onSubmit={handleSend} className="chat-form">
                <textarea
                  ref={textareaRef}
                  rows="1"
                  placeholder={`Escribe un comunicado en ${plans.find(p=>p.id === selectedPlanId)?.title}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="wall-input-textarea"
                />
                <button type="submit" disabled={!newMessage.trim()} className="send-btn-admin">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ... (Modal de eliminación queda igual) ... */}
      {postToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-enter" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center', width: '90%' }}>
            <div style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}><Trash2 size={50} /></div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#111' }}>¿Eliminar este mensaje?</h2>
            <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' }}>Esta acción es irreversible.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setPostToDelete(null)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontWeight: '600', flex: 1 }}>Cancelar</button>
              <button onClick={executeDeletePost} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', flex: 1 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWall;