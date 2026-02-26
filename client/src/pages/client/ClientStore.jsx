import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Tag, UploadCloud, X, CheckCircle, Loader2, Info } from 'lucide-react';
import './ClientStore.css';

function ClientStore() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Pago
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [bankInfo, setBankInfo] = useState({ alias: '', cbu: '', name: '' });

  const [loadingMP, setLoadingMP] = useState(null);

  // --- CLOUDINARY CONFIG ---
  const CLOUD_NAME = "dpmjmyuib"; 
  const UPLOAD_PRESET = "app_ro_preset"; 



 useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Traemos los planes
        const resPlans = await axios.get('/plans');
        setPlans(resPlans.data.filter(p => p.isActive));

        // 2. Traemos los datos bancarios dinámicos
        const resBank = await axios.get('/settings/bank');
        setBankInfo(resBank.data);

      } catch (error) {
        console.error("Error cargando la tienda", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Función para formatear moneda
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

  // Calcular precio con descuento
  const getFinalPrice = (price, discount) => {
    if (!discount) return price;
    return price - (price * (discount / 100));
  };

  // Manejar el envío del comprobante
  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!receiptFile) return alert("Por favor, selecciona la foto del comprobante.");

    setUploading(true);
    try {
      // 1. Subir imagen a Cloudinary
      const formData = new FormData();
      formData.append('file', receiptFile);
      formData.append('upload_preset', UPLOAD_PRESET);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const cloudData = await cloudRes.json();
      
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || "Error en Cloudinary");
      
      const uploadedUrl = cloudData.secure_url;

      // 2. Enviar datos al Backend
      const finalPrice = getFinalPrice(selectedPlan.price, selectedPlan.transferDiscount);

      await axios.post('/payments/transfer', {
        userId: user.id,
        planId: selectedPlan.id,
        amount: finalPrice,
        receiptUrl: uploadedUrl
      });

      alert("¡Comprobante enviado con éxito! 🚀 Ro lo verificará a la brevedad para darte acceso.");
      
      // Limpiar y cerrar modal
      setReceiptFile(null);
      setSelectedPlan(null);

    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu pago. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleMercadoPagoPayment = async (plan) => {
    setLoadingMP(plan.id); 
    try {
      const res = await axios.post('/payments/mp/create_preference', {
        title: plan.title,
        price: plan.price, 
        planId: plan.id,
        userId: user.id
      });

      // ¡Magia! Redirigimos al usuario a la URL de Mercado Pago
      window.location.href = res.data.init_point;
    } catch (error) {
      console.error(error);
      alert("Error al conectar con Mercado Pago. Intenta nuevamente.");
    } finally {
      setLoadingMP(null);
    }
  };

  if (loading) return <div className="store-loader">Cargando tienda...</div>;

  return (
    <div className="client-store-page">
      
      <header className="store-header">
        <h1>Tienda de Planes</h1>
        <p>Elige tu próximo objetivo. ¡Aprovecha los descuentos por transferencia!</p>
      </header>

      <div className="store-grid">
        {plans.length === 0 ? (
          <p className="empty-store-msg">No hay planes disponibles en este momento.</p>
        ) : (
          plans.map(plan => {
            const hasDiscount = plan.transferDiscount > 0;
            const finalPrice = getFinalPrice(plan.price, plan.transferDiscount);

            return (
              <div key={plan.id} className="store-plan-card">
                {hasDiscount && (
                  <div className="discount-badge">
                    <Tag size={14} /> {plan.transferDiscount}% OFF
                  </div>
                )}
                
                <h2 className="plan-title">{plan.title}</h2>
                <p className="plan-duration"> Duración: {plan.duration} {plan.duration === 1 ? 'Semana' : 'Semanas'}</p>
                <p className="plan-desc">{plan.description || "Plan de entrenamiento personalizado."}</p>
                
                <div className="plan-price-box">
                  {hasDiscount ? (
                    <>
                      <span className="old-price">{formatPrice(plan.price)}</span>
                      <span className="new-price">{formatPrice(finalPrice)}</span>
                      <span className="price-note">Abonando por transferencia</span>
                    </>
                  ) : (
                    <span className="new-price">{formatPrice(plan.price)}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className="buy-btn" 
                    onClick={() => handleMercadoPagoPayment(plan)}
                    disabled={loadingMP === plan.id}
                    style={{ backgroundColor: '#009ee3', color: 'white' }}
                  >
                    {loadingMP === plan.id ? <Loader2 className="spin" size={18} /> : <ShoppingBag size={18} />} 
                    Pagar con Mercado Pago
                  </button>

                  <button 
                    className="buy-btn" 
                    onClick={() => setSelectedPlan(plan)}
                    style={{ backgroundColor: '#111', color: 'white' }}
                  >
                    Transferencia ({plan.transferDiscount}% OFF)
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL DE TRANSFERENCIA --- */}
      {selectedPlan && (
        <div className="store-modal-overlay">
          <div className="store-modal-content animate-slide-up">
            
            <div className="store-modal-header">
              <h3>Pago por Transferencia</h3>
              <button onClick={() => { setSelectedPlan(null); setReceiptFile(null); }} className="close-modal-btn" disabled={uploading}>
                <X size={24} />
              </button>
            </div>

            <div className="store-modal-body">
              <div className="transfer-instructions">
                <div className="instruction-step">
                  <span className="step-num">1</span>
                  <p>Transfiere exactamente <strong>{formatPrice(getFinalPrice(selectedPlan.price, selectedPlan.transferDiscount))}</strong> a la siguiente cuenta:</p>
                </div>
                
                <div className="bank-data-box">
                  <p><span>Alias:</span> <strong>{bankInfo.alias || 'No configurado'}</strong></p>
                  <p><span>CBU/CVU:</span> <strong>{bankInfo.cbu || 'No configurado'}</strong></p>
                  <p><span>Titular:</span> {bankInfo.name || 'No configurado'}</p>
                </div>

                <div className="instruction-step">
                  <span className="step-num">2</span>
                  <p>Sube la captura de pantalla del comprobante de transferencia.</p>
                </div>

                <label className="file-upload-box">
                  <input 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    onChange={(e) => setReceiptFile(e.target.files[0])} 
                    disabled={uploading}
                  />
                  {receiptFile ? (
                    <div className="file-success">
                      <CheckCircle size={32} color="#10b981" />
                      <span>{receiptFile.name}</span>
                    </div>
                  ) : (
                    <div className="file-prompt">
                      <UploadCloud size={32} />
                      <span>Toca aquí para seleccionar tu foto</span>
                    </div>
                  )}
                </label>
                
                <div className="info-warning">
                  <Info size={16} />
                  <span>Tu plan se activará en cuanto Ro verifique el comprobante.</span>
                </div>
              </div>

              <button 
                className="confirm-transfer-btn" 
                onClick={handleConfirmTransfer}
                disabled={!receiptFile || uploading}
              >
                {uploading ? <><Loader2 className="spin" size={20} /> Enviando...</> : 'Ya transferí, enviar comprobante'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ClientStore;