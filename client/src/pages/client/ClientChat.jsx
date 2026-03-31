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
    showAlert("💡 Tip para videos: Grabá en 1080p y máximo 30 segundos para enviarlos más rápido.", "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, uploading]);

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
      e.target.value = null; 
      return showAlert(`El archivo es muy pesado. Máximo ${limitMB}MB.`, 'error'); 
    }

    setUploading(true);
    setUploadProgress(0); 
    
    if (type === 'VIDEO') {
       showAlert("Subiendo video. Por favor no cierres esta pantalla.", "info");
    } else {
       showAlert("Subiendo imagen... por favor no cierres esta pantalla.", "info");
    }
    
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
      
      // 👇 CAMBIO 1: Forzamos la extensión .mp4 para que todos los celulares lo puedan leer
      let uploadedUrl = cloudRes.data.secure_url;

      if (type === 'VIDEO') {
        const urlParts = uploadedUrl.split('/upload/');
        uploadedUrl = `${urlParts[0]}/upload/f_mp4,q_auto/${urlParts[1]}`;
      }

      await axios.post('/chat', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        content: null, 
        mediaUrl: uploadedUrl,
        mediaType: type
      });
      
      fetchMessages();
      
     } catch (error) {
      console.error("Detalle del error:", error);
      
      if (error.response) {
        const detalle = error.response.data?.error?.message || error.response.data?.error || error.response.status;
        showAlert(`Error en la nube: ${detalle}`, 'error');
      } else if (error.request) {
        showAlert("Tiempo de espera agotado. El video es muy pesado para tu conexión móvil.", 'error');
      } else {
        showAlert(`Error: ${error.message}`, 'error');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0); 
      e.target.value = null; 
    }
  };

  const handleLabelClick = (e) => {
    if (uploading) {
      e.preventDefault(); 
      showAlert("Ya hay un archivo subiéndose. Por favor, esperá.", "warning");
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

      <div 
        className="pchat-messages-area" 
        ref={chatContainerRef} 
        onScroll={handleScroll}
      >
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
                    {/* 👇 CAMBIO 2: Agregamos playsInline y preload="metadata" para iPhones */}
                    <video 
                      src={msg.mediaUrl} 
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
           <>
             <div className="pchat-row pchat-row-mine">
               <div className="pchat-bubble pchat-bubble-mine pchat-uploading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Loader2 className="spin" size={16}/> Subiendo archivo... {uploadProgress}%
               </div>
             </div>
           </>
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
          
          <label 
            className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} 
            title="Enviar Video"
            onClick={handleLabelClick}
            style={{ padding: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <input 
              type="file" 
              accept="video/*" 
              style={{ display: 'none' }} 
              onChange={(e) => handleFileUpload(e, 'VIDEO')} 
              disabled={uploading}
            />
            <Video size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>

          <label 
            className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} 
            title="Enviar Imagen"
            onClick={handleLabelClick}
            style={{ padding: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
             <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e, 'IMAGE')} 
              disabled={uploading}
            />
            <ImageIcon size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>

          <input 
            type="text" 
            placeholder={uploading ? `Subiendo archivo... ${uploadProgress}%` : "Mensaje..."}
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