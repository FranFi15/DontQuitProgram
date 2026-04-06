import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext'; 
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

  // Filtros de Pasos
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [followUpFilter, setFollowUpFilter] = useState(null); // 👈 CAMBIADO: Empieza en null
  const [searchTerm, setSearchTerm] = useState('');

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
        const activePaidPlans = resPlans.data
          .filter(p => p.isActive && p.price > 0)
          .sort((a, b) => a.id - b.id);
        setPlans(activePaidPlans);

        const resBank = await axios.get('/settings/bank');
        setBankInfo(resBank.data);
        
        const uniqueCategories = [...new Set(activePaidPlans.filter(p => p.planType?.name).map(p => p.planType.name))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error cargando la tienda", error);
        showAlert("Error al cargar la tienda.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showAlert]);

  const formatPriceARS = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  const getFinalPrice = (price, discount) => discount ? price - (price * (discount / 100)) : price;

  // Lógica de Filtrado final
  const filteredPlans = plans.filter(plan => {
    const matchesCategory = plan.planType?.name === selectedCategory;
    const matchesFollowUp = (followUpFilter === 'WITH' ? plan.hasFollowUp : !plan.hasFollowUp);
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesFollowUp && matchesSearch;
  });

  const handleMercadoPagoPayment = async () => {
    setLoadingMP(true); 
    try {
      const res = await axios.post('/payments/mp/create_preference', {
        title: planToBuy.title, price: planToBuy.price, planId: planToBuy.id, userId: user.id
      });
      window.location.href = res.data.init_point;
    } catch (error) { showAlert("Error con Mercado Pago.", "error"); }
    finally { setLoadingMP(false); }
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!receiptFile) return showAlert("Selecciona el comprobante.", "error");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const cloudData = await cloudRes.json();
      const finalPrice = getFinalPrice(planToBuy.price, planToBuy.transferDiscount);
      await axios.post('/payments/transfer', { userId: user.id, planId: planToBuy.id, amount: finalPrice, receiptUrl: cloudData.secure_url });
      showAlert("¡Enviado! Ro lo verificará pronto.", "success");
      setPlanToBuy(null);
    } catch (error) { showAlert("Error en transferencia.", "error"); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="cstore-loader">Cargando tienda...</div>;

  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="cstore-page">
        <header className="cstore-header">
          <h1>Tienda de Planes</h1>
          <p>Encontrá tu entrenamiento ideal en pocos pasos.</p>
        </header>

        {/* PASO 1: CATEGORÍAS */}
        <div className="cstore-step-container">
            <h2 className="cstore-step-title">1. Seleccioná tu Categoria</h2>
            <div className="cstore-category-grid">
                {categories.map((cat, idx) => (
                    <button 
                        key={idx} 
                        className={`cstore-cat-card ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedCategory(cat);
                            setFollowUpFilter(null); // Reseteamos seguimiento al cambiar categoría
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* PASO 2: SEGUIMIENTO (Solo aparece si seleccionó Paso 1) */}
        {selectedCategory && (
            <div className="cstore-step-container cstore-animate-fade-in">
                <h2 className="cstore-step-title">2. ¿Querés seguimiento de Ro?</h2>
                <div className="cstore-followup-selector">
                    <button className={`cstore-pill ${followUpFilter === 'WITH' ? 'active' : ''}`} onClick={() => setFollowUpFilter('WITH')}>Con Seguimiento</button>
                    <button className={`cstore-pill ${followUpFilter === 'WITHOUT' ? 'active' : ''}`} onClick={() => setFollowUpFilter('WITHOUT')}>Sin Seguimiento</button>
                </div>
            </div>
        )}

        {/* PASO 3: LISTADO DE PLANES (Solo aparece si seleccionó Paso 1 Y Paso 2) */}
        {selectedCategory && followUpFilter && (
            <div className="cstore-results-container cstore-animate-slide-up">
                <div className="cstore-search-mini" style={{ marginBottom: '2rem' }}>
                    <Search size={16} />
                    <input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="cstore-grid">
                    {filteredPlans.length === 0 ? (
                        <p className="cstore-empty-msg">No hay planes para esta selección.</p>
                    ) : (
                        filteredPlans.map(plan => (
                            <div key={plan.id} className={`cstore-plan-card ${plan.hasFollowUp ? 'cstore-premium-border' : ''}`}>
                                {plan.transferDiscount > 0 && <div className="cstore-discount-badge"><Tag size={14}/> {plan.transferDiscount}% OFF</div>}
                                <div className="cstore-plan-tags-row">
                                    <span className="cstore-plan-category-tag">{plan.planType.name}</span>
                                    {plan.hasFollowUp && <span className="cstore-plan-followup-tag"><Activity size={12}/> 1 a 1</span>}
                                </div>
                                <h2 className="cstore-plan-title">{plan.title}</h2>
                                <p className="cstore-plan-duration">{plan.duration} Semanas</p>
                                <p className="cstore-plan-desc">{plan.description}</p>
                                <div className="cstore-plan-price-box">
                                    <span className="cstore-new-price">{formatPriceARS(plan.price)}</span>
                                    {plan.internationalPrice > 0 && <span className="cstore-intl-price-tag">o USD ${plan.internationalPrice}</span>}
                                </div>
                                <button className="cstore-main-buy-btn" onClick={() => { setPlanToBuy(plan); setPaymentMethod(null); }}>
                                    <ShoppingBag size={18} /> Comprar
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* MODAL DE PAGO */}
        {planToBuy && (
          <div className="cstore-modal-overlay">
            <div className="cstore-modal-content">
              <div className="cstore-modal-header">
                <h3>Método de Pago</h3>
                <button onClick={() => setPlanToBuy(null)} className="cstore-close-modal-btn"><X size={24} /></button>
              </div>
              <div className="cstore-modal-body">
                {!paymentMethod ? (
                  <div className="cstore-payment-options-grid">
                    <button className="cstore-pay-option-btn cstore-mp" onClick={handleMercadoPagoPayment} disabled={loadingMP}>
                      {loadingMP ? <Loader2 className="cstore-spin" /> : <CreditCard />}
                      <div className="cstore-po-text"><strong>Mercado Pago</strong><span>ARS</span></div>
                    </button>
                    <button className="cstore-pay-option-btn cstore-transfer" onClick={() => setPaymentMethod('TRANSFER')}>
                      <Landmark />
                      <div className="cstore-po-text"><strong>Transferencia</strong><span>{planToBuy.transferDiscount}% OFF</span></div>
                    </button>
                    {planToBuy.internationalPrice > 0 && (
                        <div className="cstore-pay-option-paypal">
                            <PayPalButtons 
                                style={{ layout: "horizontal" }} 
                                createOrder={async () => {
                                    const res = await axios.post('/payments/paypal/create-order', { title: planToBuy.title, price: planToBuy.internationalPrice });
                                    return res.data.id;
                                }}
                                onApprove={async (data) => {
                                    const res = await axios.post('/payments/paypal/capture-order', { orderID: data.orderID, userId: user.id, planId: planToBuy.id });
                                    if (res.data.success) { showAlert("Pago exitoso", "success"); setPlanToBuy(null); navigate("/app/home"); }
                                }}
                            />
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="cstore-transfer-flow-container">
                    <button className="cstore-back-pay-btn" onClick={() => setPaymentMethod(null)}>← Volver</button>
                    <div className="cstore-bank-data-box">
                      <p>Alias: <strong>{bankInfo.alias}</strong></p>
                      <p>CBU: <strong>{bankInfo.cbu}</strong></p>
                      <div className="cstore-transfer-total-highlight">Total: {formatPriceARS(getFinalPrice(planToBuy.price, planToBuy.transferDiscount))}</div>
                    </div>
                    <label className="cstore-file-upload-box">
                      <input type="file" accept="image/*" hidden onChange={(e) => setReceiptFile(e.target.files[0])} />
                      {receiptFile ? <div className="cstore-file-success"><span>{receiptFile.name}</span></div> : <span>Subir comprobante</span>}
                    </label>
                    <button className="cstore-confirm-transfer-btn" onClick={handleConfirmTransfer} disabled={!receiptFile || uploading}>Confirmar envío</button>
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