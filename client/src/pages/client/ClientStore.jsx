import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; // 👈 1. IMPORTAMOS EL CONTEXTO
import { ShoppingBag, Tag, UploadCloud, X, CheckCircle, Loader2, Search, CreditCard, Landmark, Globe, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import './ClientStore.css';

function ClientStore() {
  const { user } = useAuth();
  const { showAlert } = useAlert(); 
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagos
  const [planToBuy, setPlanToBuy] = useState(null); 
  const [paymentMethod, setPaymentMethod] = useState(null); 

  // Transferencia
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bankInfo, setBankInfo] = useState({ alias: '', cbu: '', name: '' });
  const [loadingMP, setLoadingMP] = useState(false);

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPlans = await axios.get('/plans');
        // Filtramos solo los activos
        const activePlans = resPlans.data.filter(p => p.isActive);
        setPlans(activePlans);

        const resBank = await axios.get('/settings/bank');
        setBankInfo(resBank.data);

        const uniqueCategories = [
          ...new Set(
            activePlans
              .filter(p => p.planType && p.planType.name)
              .map(p => p.planType.name)
          )
        ];
        setCategories(uniqueCategories);

      } catch (error) {
        console.error("Error cargando la tienda", error);
        // 👈 3. ALERTA SI FALLA LA CARGA INICIAL
        showAlert("Error al cargar la tienda. Por favor, recarga la página.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showAlert]);

  const formatPriceARS = (price) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

  const getFinalPrice = (price, discount) => {
    if (!discount) return price;
    return price - (price * (discount / 100));
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const planCategoryName = plan.planType?.name || 'Sin Categoría'; 
    const matchesCategory = selectedCategory === 'ALL' || planCategoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleMercadoPagoPayment = async () => {
    setLoadingMP(true); 
    try {
      const res = await axios.post('/payments/mp/create_preference', {
        title: planToBuy.title,
        price: planToBuy.price, 
        planId: planToBuy.id,
        userId: user.id
      });
      window.location.href = res.data.init_point;
    } catch (error) {
      console.error(error);
      // 👈 4. ALERTA DE ERROR EN MERCADO PAGO
      showAlert("Error conectando con Mercado Pago.", "error");
    } finally {
      setLoadingMP(false);
    }
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    // 👈 5. ALERTA DE VALIDACIÓN
    if (!receiptFile) return showAlert("Por favor, selecciona la foto del comprobante.", "error");

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
      const finalPrice = getFinalPrice(planToBuy.price, planToBuy.transferDiscount);

      await axios.post('/payments/transfer', {
        userId: user.id,
        planId: planToBuy.id,
        amount: finalPrice,
        receiptUrl: uploadedUrl
      });

      // 👈 6. ALERTA DE ÉXITO EN TRANSFERENCIA
      showAlert("¡Comprobante enviado! 🚀 Ro lo verificará pronto.", "success");
      setReceiptFile(null);
      setPlanToBuy(null);
      setPaymentMethod(null);
    } catch (error) {
      console.error(error);
      // 👈 7. ALERTA DE ERROR AL ENVIAR TRANSFERENCIA
      showAlert("Error al procesar la transferencia.", "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="store-loader">Cargando la tienda de Gain Wellness...</div>;

  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="client-store-page">
        
        <header className="store-header">
          <h1>Tienda de Planes</h1>
          <p>Alcanza tu mejor versión con asesoría profesional.</p>
        </header>

        {/* BARRA DE FILTROS */}
        <div className="store-filters-container">
          <div className="store-search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar plan por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="store-category-select" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
            <option value="Sin Categoría">Sin Categoría</option>
          </select>
        </div>

        <div className="store-grid">
          {filteredPlans.length === 0 ? (
            <p className="empty-store-msg">No hay planes que coincidan con tu búsqueda.</p>
          ) : (
            filteredPlans.map(plan => {
              const hasDiscount = plan.transferDiscount > 0;
              const finalPrice = getFinalPrice(plan.price, plan.transferDiscount);

              return (
                <div key={plan.id} className={`store-plan-card ${plan.hasFollowUp ? 'premium-border' : ''}`}>
                  {hasDiscount && (
                    <div className="discount-badge">
                      <Tag size={14} /> {plan.transferDiscount}% OFF Trans
                    </div>
                  )}
                  
                  {/* TAGS DE INFORMACIÓN DEL PLAN (Categoría + Seguimiento) */}
                  <div className="plan-tags-row">
                    {plan.planType && <span className="plan-category-tag">{plan.planType.name}</span>}
                    {plan.hasFollowUp && (
                      <span className="plan-followup-tag">
                        <Activity size={12}/> Seguimiento 1 a 1
                      </span>
                    )}
                  </div>
                  
                  <h2 className="plan-title">{plan.title}</h2>
                  <p className="plan-duration">Duración: {plan.duration} {plan.duration === 1 ? 'Semana' : 'Semanas'}</p>
                  <p className="plan-desc">{plan.description || "Plan personalizado para tus objetivos."}</p>
                  
                  <div className="plan-price-box">
                    {hasDiscount ? (
                      <>
                        <span className="new-price">{formatPriceARS(plan.price)}</span>
                      </>
                    ) : (
                      <span className="new-price">{formatPriceARS(plan.price)}</span>
                    )}
                    {plan.internationalPrice > 0 && (
                        <span className="intl-price-tag">o USD ${plan.internationalPrice}</span>
                    )}
                  </div>

                  <button 
                    className="buy-btn main-buy-btn" 
                    onClick={() => { setPlanToBuy(plan); setPaymentMethod(null); }}
                  >
                    <ShoppingBag size={18} /> Comprar Ahora
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL DE COMPRA */}
        {planToBuy && (
          <div className="store-modal-overlay">
            <div className="store-modal-content animate-slide-up">
              
              <div className="store-modal-header">
                <h3>Elige tu método de pago</h3>
                <button onClick={() => { setPlanToBuy(null); setPaymentMethod(null); }} className="close-modal-btn">
                  <X size={24} />
                </button>
              </div>

              <div className="store-modal-body">
                
                {!paymentMethod && (
                  <div className="payment-options-grid">
                    <p className="payment-plan-target">Adquiriendo: <strong>{planToBuy.title}</strong></p>

                    <button className="pay-option-btn mp" onClick={handleMercadoPagoPayment} disabled={loadingMP}>
                      {loadingMP ? <Loader2 className="spin" size={20} /> : <CreditCard size={20} />}
                      <div className="po-text">
                        <strong>Mercado Pago</strong>
                        <span>Tarjetas o dinero en cuenta (ARS)</span>
                      </div>
                    </button>

                    <button className="pay-option-btn transfer" onClick={() => setPaymentMethod('TRANSFER')}>
                      <Landmark size={20} />
                      <div className="po-text">
                        <strong>Transferencia Bancaria</strong>
                        <span>{planToBuy.transferDiscount ? `¡Aplica el ${planToBuy.transferDiscount}% OFF de descuento!` : 'Alias / CBU (ARS)'}</span>
                      </div>
                    </button>

                    {planToBuy.internationalPrice > 0 && (
                      <div className="pay-option-paypal">
                        <div className="po-title"><Globe size={16}/> Internacional (USD)</div>
                        <PayPalButtons 
                            style={{ layout: "horizontal", color: "gold", shape: "rect", height: 45 }}
                            createOrder={async () => {
                                const res = await axios.post('/payments/paypal/create-order', {
                                    title: planToBuy.title, price: planToBuy.internationalPrice 
                                });
                                return res.data.id; 
                            }}
                            onApprove={async (data) => {
                                try {
                                    const res = await axios.post('/payments/paypal/capture-order', {
                                        orderID: data.orderID, userId: user.id, planId: planToBuy.id
                                    });
                                    if (res.data.success) {
                                        // 👈 8. ALERTA DE ÉXITO EN PAYPAL
                                        showAlert("¡Pago exitoso! Acceso activado.", "success");
                                        setPlanToBuy(null);
                                        navigate("/app/home");
                                    }
                                } catch (error) { 
                                    // 👈 9. ALERTA DE ERROR EN PAYPAL
                                    showAlert("Error al procesar PayPal.", "error"); 
                                }
                            }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'TRANSFER' && (
                  <div className="transfer-flow-container animate-fade-in">
                    <button className="back-pay-btn" onClick={() => setPaymentMethod(null)}>← Volver a métodos</button>
                    
                    <div className="bank-data-box">
                      <p><span>Alias:</span> <strong>{bankInfo.alias}</strong></p>
                      <p><span>CBU:</span> <strong>{bankInfo.cbu}</strong></p>
                      <p><span>Titular:</span> {bankInfo.name}</p>
                      <div className="transfer-total-highlight">
                        Total: {formatPriceARS(getFinalPrice(planToBuy.price, planToBuy.transferDiscount))}
                      </div>
                    </div>

                    <label className="file-upload-box">
                      <input type="file" accept="image/*" hidden onChange={(e) => setReceiptFile(e.target.files[0])} disabled={uploading} />
                      {receiptFile ? (
                        <div className="file-success"><CheckCircle size={24} /> <span>{receiptFile.name}</span></div>
                      ) : (
                        <div className="file-prompt"><UploadCloud size={24} /> <span>Subir comprobante</span></div>
                      )}
                    </label>

                    <button className="confirm-transfer-btn" onClick={handleConfirmTransfer} disabled={!receiptFile || uploading}>
                      {uploading ? <Loader2 className="spin" /> : 'Confirmar envío'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </PayPalScriptProvider>
  );
}

export default ClientStore;