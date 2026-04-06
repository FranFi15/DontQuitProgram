import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; 
import { Send, Video, Image as ImageIcon, Loader2, ArrowDown } from 'lucide-react';
import './ClientChat.css';

function ClientChat() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); 
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); 
  const textareaRef = useRef(null); // 👇 REF para el auto-resize

  const ADMIN_ID = 41; 

  // 1. Tip de bienvenida
  useEffect(() => {
    showAlert("💡 Tip: Los videos de hasta 30-40 seg. suben mucho más rápido.", "info");
  }, [showAlert]); 

  // 2. EFECTO PARA AUTO-AJUSTAR EL ALTO DEL TEXTAREA
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  // 3. Lógica para marcar mensajes como LEÍDOS (Limpia el punto rojo)
  const markMessagesAsRead = async () => {
    if (!user?.id) return;
    try {
      // Marcamos como leídos los mensajes que mandó Ro (ADMIN_ID) al alumno (user.id)
      await axios.put('/chat/read', { 
        senderId: ADMIN_ID, 
        receiverId: user.id 
      });
    } catch (error) {
      console.error("Error al marcar como leído", error);
    }
  };

  const fetchMessages = async () => {
    if (!user?.id) return; 
    try {
      const res = await axios.get(`/chat/${user.id}/${ADMIN_ID}`);
      setMessages(res.data);
      // Si hay mensajes nuevos mientras el usuario está en la pantalla, los marcamos como leídos
      if (res.data.some(m => m.senderId === ADMIN_ID && !m.isRead)) {
        markMessagesAsRead();
      }
    } catch (error) {
      console.error("Error cargando chat", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      markMessagesAsRead(); // Marcamos como leídos apenas entra
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, uploading]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;

    const limitMB = type === 'VIDEO' ? 50 : 20;
    if (file.size > limitMB * 1024 * 1024) {
      e.target.value = null; 
      return showAlert(`Archivo muy pesado. Máximo ${limitMB}MB.`, 'error'); 
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0); 
    
    try {
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      
      const uploadedUrl = res.data?.url;
      if (!uploadedUrl) throw new Error("Servidor no devolvió URL");

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
      showAlert("Error al subir el archivo.", 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0); 
      e.target.value = null; 
    }
  };

  const getFixedVideoUrl = (url) => {
    if (!url || typeof url !== 'string' || url.length < 10) return "";
    if (url.includes('f_mp4')) return url;
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/f_mp4,q_auto/');
    }
    return url;
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user?.id) return;
    try {
      await axios.post('/chat', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        content: inputText,
        mediaType: 'TEXT'
      });
      setInputText('');
      fetchMessages();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="pchat-container">
      <div className="pchat-header">
        <div className="pchat-header-info">
          <div className="pchat-avatar">
            <img src="https://ui-avatars.com/api/?name=Rocio&background=000&color=fff" alt="Coach" />
          </div>
          <div className="pchat-title-box">
            <h2>Coach Ro</h2>
            <p>Soporte Premium</p>
          </div>
        </div>
      </div>

      <div className="pchat-messages-area" ref={chatContainerRef} onScroll={() => {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
      }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`pchat-row ${msg.senderId === user?.id ? 'pchat-row-mine' : 'pchat-row-theirs'}`}>
            <div className={`pchat-bubble ${msg.senderId === user?.id ? 'pchat-bubble-mine' : 'pchat-bubble-theirs'}`}>
              {msg.mediaType === 'IMAGE' && <img src={msg.mediaUrl} alt="adjunto" className="pchat-media-img" />}
              {msg.mediaType === 'VIDEO' && (
                <video src={getFixedVideoUrl(msg.mediaUrl)} controls playsInline preload="metadata" className="pchat-media-video" />
              )}
              {msg.content && <p className="pchat-text">{msg.content}</p>}
              <span className="pchat-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        ))}
        {uploading && (
           <div className="pchat-row pchat-row-mine">
             <div className="pchat-bubble pchat-bubble-mine pchat-uploading">
               <Loader2 className="spin" size={16}/> Subiendo... {uploadProgress}%
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pchat-input-wrapper">
        <form className="pchat-form" onSubmit={handleSendText}>
          <label className="pchat-attach-btn" style={{ padding: '10px', cursor: 'pointer' }}>
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'VIDEO')} disabled={uploading}/>
            <Video size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>
          <label className="pchat-attach-btn" style={{ padding: '10px', cursor: 'pointer' }}>
             <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'IMAGE')} disabled={uploading}/>
            <ImageIcon size={24} color={uploading ? "#ccc" : "#6b7280"} />
          </label>

          {/* 👇 CAMBIO: Textarea auto-ajustable (Enter para bajar renglón) */}
          <textarea 
            ref={textareaRef}
            rows="1"
            placeholder={uploading ? `Cargando... ${uploadProgress}%` : "Mensaje..."} 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            disabled={uploading} 
            className="pchat-textarea-input" 
          />

          <button type="submit" className="pchat-send-btn" disabled={!inputText.trim() || uploading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClientChat;