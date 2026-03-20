import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { Send, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ClientChat.css';

function ClientChat() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); // 👈 2. EXTRAEMOS LA FUNCIÓN
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  const ADMIN_ID = 41; 
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

    const limitMB = type === 'VIDEO' ? 100 : 20;
    if (file.size > limitMB * 1024 * 1024) {
      // 👈 3. USAMOS LA NUEVA ALERTA DE ERROR
      return showAlert(`El archivo es muy pesado. Máximo ${limitMB}MB.`, 'error'); 
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const resourceType = type === 'VIDEO' ? 'video' : 'image';
      
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, 
        { method: 'POST', body: formData }
      );
      
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
         throw new Error(cloudData.error?.message || "Error al subir a Cloudinary");
      }

      const uploadedUrl = cloudData.secure_url;

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
        // 👈 4. ALERTA DE ERROR (le saqué el emoji ⛔ porque tu toast ya tiene ícono)
        showAlert(error.response.data.error, 'error');
      } else {
        // 👈 5. ALERTA DE ERROR GENÉRICO
        showAlert("Error al enviar el archivo.", 'error');
      }
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="pchat-container">
      
      <div className="pchat-header">
        <div className="pchat-header-info">
          <div className="pchat-avatar">
            <img src="https://ui-avatars.com/api/?name=Rocio&background=000&color=fff" alt="Coach" />
            <span className="pchat-online-dot"></span>
          </div>
          <div className="pchat-title-box">
            <h2>Coach Ro</h2>
            <p>Soporte Premium</p>
          </div>
        </div>
      </div>

      <div className="pchat-messages-area">
        {messages.length === 0 && !uploading && (
          <div className="pchat-empty-msg">
            <p>¡Hola! Envía un mensaje a Rocío para comenzar.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`pchat-row ${isMine ? 'pchat-row-mine' : 'pchat-row-theirs'}`}>
              <div className={`pchat-bubble ${isMine ? 'pchat-bubble-mine' : 'pchat-bubble-theirs'}`}>
                
                {msg.mediaType === 'IMAGE' && (
                  <div className="pchat-media-container">
                    <img src={msg.mediaUrl} alt="adjunto" className="pchat-media-img" />
                  </div>
                )}
                {msg.mediaType === 'VIDEO' && (
                  <div className="pchat-media-container">
                    <video src={msg.mediaUrl} controls className="pchat-media-video" />
                  </div>
                )}

                {msg.content && <p className="pchat-text">{msg.content}</p>}
                
                <span className="pchat-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}

        {uploading && (
           <div className="pchat-row pchat-row-mine">
             <div className="pchat-bubble pchat-bubble-mine pchat-uploading">
               <Loader2 className="spin" size={16}/> Enviando archivo...
             </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pchat-input-wrapper">
        <form className="pchat-form" onSubmit={handleSendText}>
          
          <label className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} title="Enviar Video">
            <input type="file" accept="video/*" hidden onChange={(e) => handleFileUpload(e, 'VIDEO')} disabled={uploading}/>
            <Video size={22} />
          </label>

          <label className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} title="Enviar Imagen">
            <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'IMAGE')} disabled={uploading}/>
            <ImageIcon size={22} />
          </label>

          <input 
            type="text" 
            placeholder={uploading ? "Subiendo archivo..." : "Mensaje..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={uploading}
            className="pchat-text-input"
          />
          
          <button type="submit" className={`pchat-send-btn ${inputText.trim() ? 'active' : ''}`} disabled={!inputText.trim() || uploading}>
            <Send size={18} />
          </button>

        </form>
      </div>

    </div>
  );
}

export default ClientChat;