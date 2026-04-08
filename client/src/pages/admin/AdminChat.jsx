import { useEffect, useState, useRef } from 'react';
import axios from '../../api/axios';
import { useAlert } from '../../context/AlertContext'; 
import { Send, Paperclip, Search, Video, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import './AdminChat.css';

function AdminChat() {
  const { showAlert } = useAlert(); 
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null); 
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  const MY_ID = 41;

  // 1. FUNCIÓN PARA CARGAR ALUMNOS (Incluye conteo de no leídos)
  const fetchUsers = async () => {
    try {
      // Asumimos que el backend en /chat/users ahora devuelve un campo 'unreadCount'
      const res = await axios.get('/chat/users'); 
      setUsers(res.data);
    } catch (error) { 
      console.error("Error al cargar alumnos", error); 
    }
  };

  // 2. POLLING PARA LA LISTA (Para que Ro vea los puntos rojos entrar en vivo)
  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000); // Cada 15 segundos refresca la lista
    return () => clearInterval(interval);
  }, []);

  // 3. MARCAR COMO LEÍDO AL SELECCIONAR
  const handleUserClick = async (user) => {
    setSelectedUser(user);
    
    // Si el usuario tiene mensajes sin leer, avisamos al backend
    if (user.unreadCount > 0) {
      try {
        await axios.put('/chat/read', { 
          senderId: user.id, // El alumno que mandó los mensajes
          receiverId: MY_ID   // Ro los está leyendo
        });
        // Limpiamos el contador localmente para feedback instantáneo
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, unreadCount: 0 } : u));
      } catch (error) {
        console.error("Error al marcar como leído", error);
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    if (selectedUser) {
      const fetchChat = async () => {
        try {
          const res = await axios.get(`/chat/${MY_ID}/${selectedUser.id}`);
          setMessages(res.data);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (error) { showAlert("Error al cargar chat.", "error"); }
      };
      fetchChat();
    }
  }, [selectedUser, showAlert]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedUser) return;
    try {
      const res = await axios.post('/chat/', {
        senderId: MY_ID, 
        receiverId: selectedUser.id,
        content: newMessage,
        mediaUrl: attachment?.url || null,
        mediaType: attachment?.type || null
      });
      setMessages([...messages, { ...res.data, sender: { role: 'ADMIN' } }]);
      setNewMessage("");
      setAttachment(null);
    } catch (error) { showAlert("Error al enviar.", "error"); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const limitMB = file.type.startsWith('video/') ? 70 : 20;
    if (file.size > limitMB * 1024 * 1024) return showAlert(`Máximo ${limitMB}MB.`, 'error');

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachment({ url: res.data.url, type: res.data.type });
    } catch (error) { showAlert("Error al subir.", "error"); }
    finally { setUploading(false); }
  };

  const getFixedVideoUrl = (url) => {
    if (!url || typeof url !== 'string' || url.length < 10) return "";
    if (url.includes('f_mp4')) return url;
    if (url.includes('/upload/')) return url.replace('/upload/', '/upload/f_mp4,q_auto/');
    return url;
  };


  return (
    <div className="chat-page-layout">
      <div className={`chat-container ${selectedUser ? 'chat-active' : ''}`}>
        <div className="chat-sidebar">
          <div className="sidebar-search">
            <Search size={16} className="search-icon"/>
            <input placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          <div className="users-list">
            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <div 
                key={u.id} 
                // 👇 CLASE DINÁMICA: Si tiene no leídos, aplicamos 'has-unread'
                className={`user-item ${selectedUser?.id === u.id ? 'active' : ''} ${u.unreadCount > 0 ? 'has-unread' : ''}`} 
                onClick={() => handleUserClick(u)}
              >
                <div className="avatar-circle">
                  {u.name.charAt(0)}
                  {/* 👇 PUNTO ROJO: Solo si unreadCount > 0 */}
                  {u.unreadCount > 0 && <span className="unread-dot" />}
                </div>
                <div className="user-details">
                  <span className="user-name">{u.name}</span>
                  {/* Opcional: mostrar un mini texto si hay pendientes */}
                  {u.unreadCount > 0 && <span className="user-last-msg">Mensaje pendiente</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <button onClick={() => setSelectedUser(null)} className="back-to-list-btn"><ArrowLeft size={24} /></button>
                <h3>{selectedUser.name}</h3>
              </div>
              <div className="messages-area">
                {messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.senderId === MY_ID ? 'me' : 'them'}`}>
                    {msg.mediaUrl && (
                      <div className="media-content">
                        {msg.mediaType === 'IMAGE' ? <img src={msg.mediaUrl} alt="adjunto" /> : 
                        <video src={getFixedVideoUrl(msg.mediaUrl)} controls playsInline preload="metadata" />}
                      </div>
                    )}
                    {msg.content && <p>{msg.content}</p>}
                    <span className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-wrapper">
                <form className="chat-input-area" onSubmit={handleSend}>
                  {attachment && (
                    <div className="attachment-preview">
                      <span>Adjunto listo</span>
                      <button type="button" onClick={() => setAttachment(null)} className="remove-attachment-btn"><X size={16}/></button>
                    </div>
                  )}
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{display:'none'}} accept="image/*,video/*"/>
                  
                  <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                    <Paperclip size={30} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows="1"
                    placeholder={uploading ? "Subiendo..." : "Escribe un mensaje..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={uploading}
                    className="chat-input-textarea"
                  />
                  
                  <button type="submit" className="send-btn" disabled={uploading || (!newMessage.trim() && !attachment)}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : <div className="no-chat-selected"><p>Selecciona un alumno.</p></div>}
        </div>
      </div>
    </div>
  );
}

export default AdminChat;