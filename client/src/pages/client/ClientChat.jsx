import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Send, Video, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ClientChat.css';

function ClientChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  const ADMIN_ID = 1; 
  
  // 👇 1. LEYENDO DESDE LAS VARIABLES DE ENTORNO 👇
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/chat/${user.id}/${ADMIN_ID}`);
      setMessages(res.data);
    } catch (error) {
      console.error("Error cargando chat", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await axios.post('/chat', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        content: inputText,
        mediaUrl: null,
        mediaType: 'TEXT'
      });
      setInputText('');
      fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const limitMB = type === 'VIDEO' ? 50 : 10;
    if (file.size > limitMB * 1024 * 1024) {
      return alert(`El archivo es muy pesado. Máximo ${limitMB}MB.`);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const resourceType = type === 'VIDEO' ? 'video' : 'image';
      
      // 👇 2. USAMOS FETCH NATIVO PARA EVITAR EL ERROR DE CORS 👇
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, 
        {
          method: 'POST',
          body: formData
        }
      );
      
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
         throw new Error(cloudData.error?.message || "Error al subir a Cloudinary");
      }

      const uploadedUrl = cloudData.secure_url;

      // Una vez que subió a Cloudinary, le avisamos a nuestro backend
      await axios.post('/chat', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        content: null, 
        mediaUrl: uploadedUrl,
        mediaType: type
      });
      
      fetchMessages();
      
    } catch (error) {
      if (error.response?.status === 403) {
        alert("⛔ " + error.response.data.error);
      } else {
        console.error("Error completo:", error);
        alert("Error al enviar el archivo.");
      }
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="chat-page-container">
      
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <img src="https://ui-avatars.com/api/?name=Rocio&background=000&color=fff" alt="Coach" />
            <span className="online-dot"></span>
          </div>
          <div className="chat-title-box">
            <h2>Coach Ro</h2>
            <p>Soporte Premium</p>
          </div>
        </div>
      </div>

      <div className="messages-scroll-area">
        {messages.length === 0 && !uploading && (
          <div className="empty-chat-msg">
            <p>¡Hola! Envía un mensaje a Rocío para comenzar.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`message-row ${isMine ? 'row-mine' : 'row-theirs'}`}>
              <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                
                {msg.mediaType === 'IMAGE' && (
                  <div className="media-container">
                    <img src={msg.mediaUrl} alt="adjunto" className="chat-media-img" />
                  </div>
                )}
                {msg.mediaType === 'VIDEO' && (
                  <div className="media-container">
                    <video src={msg.mediaUrl} controls className="chat-media-video" />
                  </div>
                )}

                {msg.content && <p className="msg-text">{msg.content}</p>}
                
                <span className="msg-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}

        {uploading && (
           <div className="message-row row-mine">
             <div className="message-bubble bubble-mine uploading-bubble">
               <Loader2 className="spin" size={16}/> Enviando archivo...
             </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSendText}>
          
          <label className={`attach-icon-btn ${uploading ? 'disabled' : ''}`} title="Enviar Video">
            <input type="file" accept="video/*" hidden onChange={(e) => handleFileUpload(e, 'VIDEO')} disabled={uploading}/>
            <Video size={22} />
          </label>

          <label className={`attach-icon-btn ${uploading ? 'disabled' : ''}`} title="Enviar Imagen">
            <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'IMAGE')} disabled={uploading}/>
            <ImageIcon size={22} />
          </label>

          <input 
            type="text" 
            placeholder={uploading ? "Subiendo archivo..." : "Mensaje..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={uploading}
            className="text-input-field"
          />
          
          <button type="submit" className={`send-msg-btn ${inputText.trim() ? 'active' : ''}`} disabled={!inputText.trim() || uploading}>
            <Send size={18} />
          </button>

        </form>
      </div>

    </div>
  );
}

export default ClientChat;