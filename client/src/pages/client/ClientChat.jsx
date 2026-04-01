import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import axiosClean from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; 
import { Send, Video, Image as ImageIcon, Loader2, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ClientChat.css';

function ClientChat() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); 
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); 

  const ADMIN_ID = 41; 
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 

  useEffect(() => {
    showAlert("💡 Tip: Los videos de hasta 30-40 seg. suben mucho más rápido.", "info");
  }, [showAlert]); 

  const fetchMessages = async () => {
    // 👇 Agregamos el user?.id para evitar que explote si el auth tarda en cargar
    if (!user?.id) return; 
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, uploading]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user?.id) return;

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
    if (!file || !user?.id) return;

    const limitMB = type === 'VIDEO' ? 50 : 20;
    if (file.size > limitMB * 1024 * 1024) {
      e.target.value = null; 
      return showAlert(`El archivo es muy pesado. Máximo ${limitMB}MB.`, 'error'); 
    }

    setUploading(true);
    setUploadProgress(0); 
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const resourceType = type === 'VIDEO' ? 'video' : 'image';
      
      const cloudRes = await axiosClean.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, 
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      const uploadedUrl = cloudRes.data?.secure_url;

      if (!uploadedUrl) {
        throw new Error("No se pudo obtener la URL de Cloudinary");
      }

      // 👇 ACÁ ESTÁ LA LIMPIEZA: No hacemos replace ni split acá, mandamos la URL cruda.
      await axios.post('/chat', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        content: null, 
        mediaUrl: uploadedUrl,
        mediaType: type
      });
      
      fetchMessages();
      
     } catch (error) {
      console.error("Error en subida:", error);
      showAlert("No se pudo subir el archivo. Intentá de nuevo.", 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0); 
      e.target.value = null; 
    }
  };

  const handleLabelClick = (e) => {
    if (uploading) {
      e.preventDefault(); 
      showAlert("Espera a que termine la subida actual.", "warning");
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 👇 Función ultra segura (evita el error K.replace)
  const getFixedVideoUrl = (url) => {
    if (!url || typeof url !== 'string' || url.length < 10) return "";
    
    // Si ya está optimizada, la dejamos igual
    if (url.includes('f_mp4')) return url;
    
    // Solo intentamos el reemplazo si existe la palabra /upload/
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/f_mp4,q_auto/');
    }
    
    return url;
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

      <div className="pchat-messages-area" ref={chatContainerRef} onScroll={handleScroll}>
        {messages.map((msg) => {
          // 👇 Chequeo de seguridad para el ID del usuario
          const isMine = msg.senderId === user?.id;
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
                    <video 
                      src={getFixedVideoUrl(msg.mediaUrl)}
                      controls 
                      playsInline 
                      preload="metadata"
                      className="pchat-media-video" 
                    />
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
               <Loader2 className="spin" size={16}/> Subiendo... {uploadProgress}%
             </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button className="pchat-scroll-down-btn" onClick={scrollToBottom}>
          <ArrowDown size={22} />
        </button>
      )}

      <div className="pchat-input-wrapper">
        <form className="pchat-form" onSubmit={handleSendText}>
          <label className="pchat-attach-btn" onClick={handleLabelClick} style={{ padding: '10px', cursor: 'pointer' }}>
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'VIDEO')} disabled={uploading}/>
            <Video size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>

          <label className="pchat-attach-btn" onClick={handleLabelClick} style={{ padding: '10px', cursor: 'pointer' }}>
             <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'IMAGE')} disabled={uploading}/>
            <ImageIcon size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>

          <input 
            type="text" 
            placeholder={uploading ? `Cargando... ${uploadProgress}%` : "Mensaje..."}
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