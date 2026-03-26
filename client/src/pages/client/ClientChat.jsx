import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import axiosClean from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; 
import { Send, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  
  const messagesEndRef = useRef(null);
  
  // 👇 REFERENCIAS SEPARADAS PARA LOS INPUTS OCULTOS
  const videoInputRef = useRef(null); 
  const imageInputRef = useRef(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 👇 MANEJADOR LIMPIO PARA EL BOTÓN DE VIDEO
  const handleVideoIconClick = () => {
    if (uploading) return;
    showAlert("Recordá: Los videos deben durar máximo 30 segundos para enviarse rápido.", "info");
    
    // Abre la cámara después de un ratito corto
    setTimeout(() => {
      if(videoInputRef.current) videoInputRef.current.click();
    }, 600);
  };

  // 👇 MANEJADOR LIMPIO PARA EL BOTÓN DE IMAGEN
  const handleImageIconClick = () => {
    if (uploading) return;
    if(imageInputRef.current) imageInputRef.current.click();
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const limitMB = type === 'VIDEO' ? 100 : 20;
    if (file.size > limitMB * 1024 * 1024) {
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
      
      const uploadedUrl = cloudRes.data.secure_url;

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
        showAlert(error.response.data.error, 'error');
      } else {
        showAlert("Error al enviar el archivo.", 'error');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0); 
      e.target.value = null; // Limpiamos el input para poder subir el mismo archivo de nuevo si hace falta
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
           <>
             <div className="pchat-row pchat-row-mine">
               <div className="pchat-bubble pchat-bubble-mine pchat-uploading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Loader2 className="spin" size={16}/> Subiendo archivo... {uploadProgress}%
               </div>
             </div>
             {uploadProgress > 0 && uploadProgress < 100 && (
               <div className="pchat-row pchat-row-mine" style={{ marginTop: '-2px' }}>
                 <span style={{ fontSize: '0.65rem', color: '#9ca3af', width: '100%', textAlign: 'right', fontStyle: 'italic' }}>
                   *Los videos grabados en 1080p se enviarán más rápido.
                 </span>
               </div>
             )}
           </>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pchat-input-wrapper">
        <form className="pchat-form" onSubmit={handleSendText}>
          
          {/* 👇 INPUTS OCULTOS (Fuera de la vista y de los botones) 👇 */}
          <input 
            type="file" 
            accept="video/mp4,video/x-m4v,video/*" 
            capture="environment" 
            style={{ display: 'none' }} // Usamos style en vez de hidden para asegurar compatibilidad
            ref={videoInputRef} 
            onChange={(e) => handleFileUpload(e, 'VIDEO')} 
          />
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            ref={imageInputRef}
            onChange={(e) => handleFileUpload(e, 'IMAGE')} 
          />

          {/* 👇 BOTONES VISIBLES (Sin la etiqueta label que causaba el loop) 👇 */}
          <button 
            type="button" // MUY IMPORTANTE: type="button" para que no envíe el formulario
            className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} 
            title="Enviar Video"
            onClick={handleVideoIconClick} 
            disabled={uploading}
            style={{ background: 'none', border: 'none', padding: 0 }} // Limpiamos estilos de botón nativo
          >
            <Video size={22} />
          </button>

          <button 
            type="button" 
            className={`pchat-attach-btn ${uploading ? 'disabled' : ''}`} 
            title="Enviar Imagen"
            onClick={handleImageIconClick}
            disabled={uploading}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <ImageIcon size={22} />
          </button>

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