import { useEffect, useState, useRef } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext'; 
import { Send, Paperclip, Search, Video, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import './AdminChat.css';

function AdminChat() {
  const navigate = useNavigate();
  const { showAlert } = useAlert(); 
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null); 
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/chat/users'); 
        setUsers(res.data);
      } catch (error) {
        console.error(error);
        showAlert("Error al cargar la lista de alumnos.", "error");
      }
    };
    fetchUsers();
  }, [showAlert]);

  useEffect(() => {
    if (selectedUser) {
      const fetchChat = async () => {
        try {
          const myId = 41; 
          const res = await axios.get(`/chat/${myId}/${selectedUser.id}`);
          setMessages(res.data);
          scrollToBottom();
          
          axios.put('/chat/read', { 
            senderId: selectedUser.id, 
            receiverId: myId          
          }).then(() => {
             setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, hasUnread: false } : u));
          }).catch(err => console.error("Error al marcar como leído:", err));

        } catch (error) {
          console.error(error);
          showAlert(`Error al cargar la conversación con ${selectedUser.name}.`, "error");
        }
      };
      fetchChat();
    }
  }, [selectedUser, showAlert]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 👇 OPCIÓN RÁPIDA: Límite de 40MB para evitar rollbacks asíncronos
    const isVideo = file.type.startsWith('video/');
    const limitMB = isVideo ? 50 : 20;
    if (file.size > limitMB * 1024 * 1024) {
      return showAlert(`El archivo es muy pesado. Máximo ${limitMB}MB para videos.`, 'error');
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('/upload', formData, {
        withCredentials: false,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachment({ url: res.data.url, type: res.data.type });
    } catch (error) {
      console.error(error);
      showAlert("Error al subir el archivo.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedUser) return;

    try {
      const payload = {
        senderId: 41, 
        receiverId: selectedUser.id,
        content: newMessage,
        mediaUrl: attachment?.url || null,
        mediaType: attachment?.type || null
      };

      const res = await axios.post('/chat/', payload);
      
      setMessages([...messages, { ...res.data, sender: { role: 'ADMIN' } }]);
      
      setNewMessage("");
      setAttachment(null);
      scrollToBottom();
    } catch (error) {
      console.error(error);
      showAlert("Error al enviar el mensaje. Inténtalo de nuevo.", "error");
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  // 👇 Función para inyectar f_mp4 en las URLs asíncronas
  const getFixedVideoUrl = (url) => {
    if (!url) return url;
    if (url.includes('f_mp4')) return url;
    return url.replace('/upload/', '/upload/f_mp4,q_auto/');
  };

  return (
    <div className="chat-page-layout">
      
      <div className="detail-header">
        <div>
          <h1 className="page-title">MENSAJERÍA</h1>
        </div>
      </div>

      <div className={`chat-container ${selectedUser ? 'chat-active' : ''}`}>
        
        <div className="chat-sidebar">
          <div className="sidebar-search">
            <Search size={16} className="search-icon"/>
            <input 
              placeholder="Buscar alumno..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="users-list">
            {users
              .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(u => (
              <div 
                key={u.id} 
                className={`user-item ${selectedUser?.id === u.id ? 'active' : ''} ${u.hasUnread ? 'has-unread' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="avatar-circle">
                  {u.name.charAt(0)}
                  {u.hasUnread && <span className="unread-dot"></span>}
                </div>
                
                <div className="user-details">
                  <span className="user-name">{u.name}</span>
                  <span className="user-last-msg">
                    {u.hasUnread ? 'Nuevo mensaje recibido' : 'Haz click para chatear'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <button className="back-to-list-btn" onClick={handleBackToList}>
                  <ArrowLeft size={24} />
                </button>
                <h3>{selectedUser.name}</h3>
              </div>

              <div className="messages-area">
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === 41;
                  return (
                    <div key={index} className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                      {msg.mediaUrl && (
                        <div className="media-content">
                          {msg.mediaType === 'IMAGE' ? (
                            <img src={msg.mediaUrl} alt="adjunto" />
                          ) : (
                            <video 
                              src={getFixedVideoUrl(msg.mediaUrl)} 
                              controls 
                              playsInline 
                              preload="metadata"
                            />
                          )}
                        </div>
                      )}
                      
                      {msg.content && <p>{msg.content}</p>}
                      
                      <span className="msg-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-wrapper">
                <form className="chat-input-area" onSubmit={handleSend}>
                  {attachment && (
                    <div className="attachment-preview">
                      <span>
                        {attachment.type === 'IMAGE' ? <ImageIcon size={14}/> : <Video size={14}/>} Archivo adjunto
                      </span>
                      <button 
                        type="button" 
                        onClick={handleRemoveAttachment} 
                        className="remove-attachment-btn"
                      >
                        <X size={16} /> Quitar
                      </button>
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    style={{display:'none'}} 
                    accept="image/*,video/*"
                  />
                  <button 
                    type="button" 
                    className="icon-btn" 
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                  >
                    <Paperclip size={30} />
                  </button>

                  <input 
                    type="text" 
                    placeholder={uploading ? "Subiendo archivo..." : "Escribe un mensaje..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={uploading}
                  />
                  
                  <button type="submit" className="send-btn" disabled={uploading}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Selecciona un alumno para comenzar a chatear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminChat;