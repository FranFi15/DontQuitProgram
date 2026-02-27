import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Tag, UploadCloud, X, CheckCircle, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import './ClientStore.css';

function ClientStore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Pago por Transferencia
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [bankInfo, setBankInfo] = useState({ alias: '', cbu: '', name: '' });
  const [loadingMP, setLoadingMP] = useState(null);

  // Variables de Entorno
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPlans = await axios.get('/plans');
        setPlans(resPlans.data.filter(p => p.isActive));

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

  const formatPriceARS = (price) => {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS', 
        maximumFractionDigits: 0 
    }).format(price);
  };

  const getFinalPrice = (price, discount) => {
    if (!discount) return price;
    return price - (price * (discount / 100));
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!receiptFile) return alert("Por favor, selecciona la foto del comprobante.");

    setUploading(true);
    try {
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
      const finalPrice = getFinalPrice(selectedPlan.price, selectedPlan.transferDiscount);

      await axios.post('/payments/transfer', {
        userId: user.id,
        planId: selectedPlan.id,
        amount: finalPrice,
        receiptUrl: uploadedUrl
      });

      alert("¡Comprobante enviado! 🚀 Ro lo verificará pronto.");
      setReceiptFile(null);
      setSelectedPlan(null);
    } catch (error) {
      console.error(error);
      alert("Error al procesar la transferencia.");
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
      window.location.href = res.data.init_point;
    } catch (error) {
      console.error(error);
      alert("Error con Mercado Pago.");
    } finally {
      setLoadingMP(null);
    }
  };

  if (loading) return <div className="store-loader">Cargando tienda...</div>;

  return (
    <PayPalScriptProvider options={{ 
      "client-id": PAYPAL_CLIENT_ID, 
      currency: "USD" 
    }}>
      <div className="client-store-page">
        
        <header className="store-header">
          <h1>Tienda de Planes</h1>
          <p>Alcanza tu mejor versión con asesoría profesional.</p>
        </header>

        <div className="store-grid">
          {plans.length === 0 ? (
            <p className="empty-store-msg">No hay planes disponibles.</p>
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
                  <p className="plan-duration">Duración: {plan.duration} {plan.duration === 1 ? 'Semana' : 'Semanas'}</p>
                  <p className="plan-desc">{plan.description || "Plan personalizado."}</p>
                  
                  <div className="plan-price-box">
                    {hasDiscount ? (
                      <>
                        <span className="old-price">{formatPriceARS(plan.price)}</span>
                        <span className="new-price">{formatPriceARS(finalPrice)}</span>
                        <span className="price-note">ARS - Transferencia</span>
                      </>
                    ) : (
                      <span className="new-price">{formatPriceARS(plan.price)}</span>
                    )}
                    {plan.internationalPrice && (
                        <span className="intl-price-tag">USD {plan.internationalPrice} (Internacional)</span>
                    )}
                  </div>

                  <div className="payment-buttons-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* MERCADO PAGO */}
                    <button 
                      className="buy-btn mp-btn" 
                      onClick={() => handleMercadoPagoPayment(plan)}
                      disabled={loadingMP === plan.id}
                      style={{ backgroundColor: '#009ee3', color: 'white' }}
                    >
                      {loadingMP === plan.id ? <Loader2 className="spin" size={18} /> : <ShoppingBag size={18} />} 
                      Pagar con Mercado Pago (ARS)
                    </button>

                    {/* PAYPAL */}
                    {plan.internationalPrice > 0 && (
                        <div style={{ zIndex: 0, position: 'relative' }}>
                        <PayPalButtons 
                            style={{ layout: "horizontal", color: "gold", shape: "rect", height: 40 }}
                            createOrder={async (data, actions) => {
                                const res = await axios.post('/payments/paypal/create-order', {
                                    title: plan.title,
                                    price: plan.internationalPrice // Usamos el precio en USD directamente
                                });
                                return res.data.id; 
                            }}
                            onApprove={async (data, actions) => {
                                try {
                                    const res = await axios.post('/payments/paypal/capture-order', {
                                        orderID: data.orderID,
                                        userId: user.id,
                                        planId: plan.id
                                    });
                                    if (res.data.success) {
                                        alert("¡Pago exitoso! Acceso activado.");
                                        navigate("/app/home");
                                    }
                                } catch (error) {
                                    alert("Error al procesar pago PayPal.");
                                }
                            }}
                        />
                        </div>
                    )}

                    {/* TRANSFERENCIA */}
                    <button 
                      className="buy-btn transfer-btn" 
                      onClick={() => setSelectedPlan(plan)}
                      style={{ backgroundColor: '#111', color: 'white' }}
                    >
                      Transferencia Bancaria
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL TRANSFERENCIA */}
        {selectedPlan && (
          <div className="store-modal-overlay">
            <div className="store-modal-content animate-slide-up">
              <div className="store-modal-header">
                <h3>Datos de Transferencia</h3>
                <button onClick={() => { setSelectedPlan(null); setReceiptFile(null); }} className="close-modal-btn">
                  <X size={24} />
                </button>
              </div>

              <div className="store-modal-body">
                <div className="bank-data-box">
                  <p><span>Alias:</span> <strong>{bankInfo.alias}</strong></p>
                  <p><span>CBU:</span> <strong>{bankInfo.cbu}</strong></p>
                  <p><span>Titular:</span> {bankInfo.name}</p>
                  <p className="total-transfer">Total a transferir: <strong>{formatPriceARS(getFinalPrice(selectedPlan.price, selectedPlan.transferDiscount))}</strong></p>
                </div>

                <label className="file-upload-box">
                  <input type="file" accept="image/*" hidden onChange={(e) => setReceiptFile(e.target.files[0])} disabled={uploading} />
                  {receiptFile ? (
                    <div className="file-success"><CheckCircle size={24} /> {receiptFile.name}</div>
                  ) : (
                    <div className="file-prompt"><UploadCloud size={24} /> Subir comprobante</div>
                  )}
                </label>

                <button className="confirm-transfer-btn" onClick={handleConfirmTransfer} disabled={!receiptFile || uploading}>
                  {uploading ? <Loader2 className="spin" /> : 'Confirmar envío'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PayPalScriptProvider>
  );
}

export default ClientStore;