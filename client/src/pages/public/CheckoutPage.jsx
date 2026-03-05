import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { ArrowLeft, Upload, CheckCircle, User, Wallet, Landmark } from 'lucide-react';
import './CheckoutPage.css';

function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  
  // Estados del flujo
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Método de pago por defecto
  const [paymentMethod, setPaymentMethod] = useState('mercadopago'); 

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [receipt, setReceipt] = useState(null);

  // Cargar los datos del plan elegido
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`/plans/${planId}`);
        setPlan(res.data);
      } catch (err) {
        setError('No pudimos cargar los datos del plan. Intentá de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  // Manejo de inputs de texto
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejo del archivo (Comprobante)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  // Pasar al paso de pago
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor, completá los datos obligatorios.');
      return;
    }
    setError('');
    setStep(2);
  };

  // Enviar todo al backend según el método de pago
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (paymentMethod === 'transfer') {
        // --- LÓGICA DE TRANSFERENCIA MANUAL ---
        if (!receipt) {
          setError('Por favor, adjuntá el comprobante de transferencia.');
          setSubmitting(false);
          return;
        }

        const data = new FormData();
        data.append('planId', planId);
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('phone', formData.phone);
        data.append('paymentMethod', 'TRANSFER');
        data.append('receipt', receipt);

        // Llamada real al backend (con foto incluida)
        await axios.post('/checkout/register-checkout', data, { 
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setStep(3); // Pantalla de éxito
        
      } else {
        // --- LÓGICA DE MERCADOPAGO / PAYPAL ---
        // Llamada real al backend para pasarelas (JSON puro sin foto)
        const response = await axios.post('/checkout/register-checkout', {
          planId,
          ...formData,
          paymentMethod: paymentMethod.toUpperCase()
        });
        
        // Redirigimos al usuario a la URL que nos devuelve MercadoPago o PayPal
        if (response.data.initPoint) {
          window.location.href = response.data.initPoint; 
        } else {
          setError('No se pudo generar el link de pago. Intentá nuevamente.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Hubo un error al procesar tu solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="checkout-loading">Cargando tu plan...</div>;
  if (!plan) return <div className="checkout-error">Plan no encontrado. <Link to="/">Volver al inicio</Link></div>;

  return (
    <div className="checkout-container">
      {/* Navbar Minimalista */}
      <nav className="checkout-nav">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Volver al inicio
        </Link>
        {/* Usamos la misma lógica de imagen que en la Landing */}
        <img src="/logob.png" alt="Don't Quit Logo" className="checkout-logo" />
      </nav>

      <div className="checkout-wrapper">
        
        {/* LADO IZQUIERDO: Resumen de Compra */}
        <div className="checkout-summary">
          <span className="summary-badge">ESTÁS POR COMPRAR</span>
          <h2>{plan.title}</h2>
          <p className="summary-desc">{plan.description}</p>
          
          <div className="summary-details">
            <div className="detail-item">
              <span>Duración:</span>
              <strong>{plan.duration} Semanas</strong>
            </div>
            <div className="detail-item price-item">
              <span>Total a pagar:</span>
              <strong className="summary-price">${plan.price} ARS</strong>
            </div>
            {plan.internationalPrice > 0 && (
              <div className="detail-item">
                <span>Precio Internacional:</span>
                <strong>{plan.internationalPrice} USD</strong>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="checkout-form-section">
          
          {/* PASO 1: DATOS DEL USUARIO */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="checkout-form animate-enter">
              <div className="step-header">
                <User size={24} className="step-icon" />
                <h3>Paso 1: Creá tu cuenta</h3>
              </div>
              
              {error && <div className="error-message">{error}</div>}

              <div className="checkout-group">
                <label>Nombre y Apellido *</label>
                <input 
                  type="text" name="name" 
                  value={formData.name} onChange={handleChange} 
                  placeholder="Ej: Juan Pérez" required 
                />
              </div>

              <div className="checkout-group">
                <label>Email *</label>
                <input 
                  type="email" name="email" 
                  value={formData.email} onChange={handleChange} 
                  placeholder="juan@email.com" required 
                />
              </div>

              <div className="checkout-group">
                <label>Contraseña *</label>
                <input 
                  type="password" name="password" 
                  value={formData.password} onChange={handleChange} 
                  placeholder="Mínimo 6 caracteres" required 
                />
              </div>

              <div className="checkout-group">
                <label>Teléfono (Opcional)</label>
                <input 
                  type="tel" name="phone" 
                  value={formData.phone} onChange={handleChange} 
                  placeholder="Ej: +54 9 11 1234-5678" 
                />
              </div>

              <button type="submit" className="btn-next">
                Continuar al Pago <ArrowLeft size={18} className="icon-flip" />
              </button>
            </form>
          )}

          {/* PASO 2: SELECCIÓN DE PAGO Y COMPROBANTE */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="checkout-form animate-enter">
              <div className="step-header">
                <Wallet size={24} className="step-icon" />
                <h3>Paso 2: ¿Cómo querés pagar?</h3>
              </div>

              {error && <div className="error-message">{error}</div>}

              {/* Selector de Método de Pago */}
              <div className="payment-methods">
                <label className={`pm-option ${paymentMethod === 'mercadopago' ? 'selected' : ''}`}>
                  <input 
                    type="radio" name="payment" value="mercadopago" 
                    checked={paymentMethod === 'mercadopago'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  {/* Logo de Mercado Pago */}
                  <img src="/mercadopago.png" alt="Mercado Pago" className="pm-logo" />
                  <span>MercadoPago </span>
                </label>
                
                <label className={`pm-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                  <input 
                    type="radio" name="payment" value="paypal" 
                    checked={paymentMethod === 'paypal'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  {/* Logo de PayPal */}
                  <img src="/paypal.png" alt="PayPal" className="pm-logo" />
                  <span>PayPal (Dólares)</span>
                </label>

                <label className={`pm-option ${paymentMethod === 'transfer' ? 'selected' : ''}`}>
                  <input 
                    type="radio" name="payment" value="transfer" 
                    checked={paymentMethod === 'transfer'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <Landmark size={24} color="#FAF3EF" className="pm-icon-lucide" />
                  <span>Transferencia Bancaria </span>
                </label>
              </div>

              {/* Detalles si elige Transferencia */}
              {paymentMethod === 'transfer' && (
                <div className="transfer-details animate-enter">
                  <div className="bank-details-box">
                    <p>Transferí el total de <strong>${plan.price} ARS</strong> a la siguiente cuenta:</p>
                    <div className="bank-info">
                      <span><strong>Alias:</strong> DONTQUIT.PROGRAM</span>
                      <span><strong>CBU/CVU:</strong> 0000003100000000000000</span>
                      <span><strong>Titular:</strong> Rocio Boxall</span>
                    </div>
                  </div>

                  <div className="form-group receipt-group">
                    <label>Subí tu comprobante *</label>
                    <div className="file-upload-wrapper">
                      <input 
                        type="file" 
                        id="receipt-upload" 
                        accept="image/*,.pdf" 
                        onChange={handleFileChange} 
                        className="file-input-hidden"
                      />
                      <label htmlFor="receipt-upload" className="file-upload-btn">
                        <Upload size={20} />
                        {receipt ? receipt.name : 'Seleccionar archivo...'}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setStep(1)} className="btn-back">
                  Volver
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Procesando...' : (paymentMethod === 'transfer' ? 'Finalizar Compra' : 'Ir a Pagar')}
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: ÉXITO (Solo para transferencias, las pasarelas redirigen) */}
          {step === 3 && (
            <div className="checkout-success animate-enter">
              <CheckCircle size={60} className="success-icon" />
              <h3>¡Solicitud recibida!</h3>
              <p>Tu cuenta fue pre-creada y recibimos tu comprobante de pago.</p>
              <p className="success-subtext">
                Rocío validará el pago a la brevedad. Te enviamos un mail de bienvenida y, una vez aprobado el pago, podrás ingresar a la app con tu email y la contraseña que elegiste.
              </p>
              <Link to="/login" className="btn-to-login">
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;