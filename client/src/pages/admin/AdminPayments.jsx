import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Check, X, Eye, DollarSign, Loader2, Settings, Landmark } from 'lucide-react';
import './AdminPayments.css';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // --- NUEVOS ESTADOS PARA CONFIGURACIÓN BANCARIA ---
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankData, setBankData] = useState({ alias: '', cbu: '', name: '' });
  const [savingBankData, setSavingBankData] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/payments/pending');
      setPayments(res.data);
    } catch (error) {
      console.error("Error cargando pagos", error);
    } finally {
      setLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN: Traer datos bancarios ---
  const fetchBankSettings = async () => {
    try {
      const res = await axios.get('/settings/bank');
      setBankData(res.data);
    } catch (error) {
      console.error("Error cargando datos bancarios", error);
    }
  };

  useEffect(() => { 
    fetchPayments(); 
    fetchBankSettings(); 
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("¿Confirmas que recibiste el dinero? Esto le dará acceso inmediato al plan.")) return;
    
    setProcessingId(id);
    try {
      await axios.put(`/payments/${id}/approve`);
      alert("✅ Pago aprobado y acceso otorgado.");
      fetchPayments(); 
    } catch (error) {
      alert("Error al aprobar el pago");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("¿Seguro que deseas rechazar este pago? El alumno no tendrá acceso.")) return;
    
    setProcessingId(id);
    try {
      await axios.put(`/payments/${id}/reject`);
      fetchPayments();
    } catch (error) {
      alert("Error al rechazar el pago");
    } finally {
      setProcessingId(null);
    }
  };

  // --- NUEVA FUNCIÓN: Guardar datos bancarios ---
  const handleSaveBankSettings = async (e) => {
    e.preventDefault();
    setSavingBankData(true);
    try {
      await axios.put('/settings/bank', bankData);
      alert('✅ Datos bancarios actualizados correctamente. Los alumnos ya los verán en la Tienda.');
      setIsBankModalOpen(false);
    } catch (error) {
      alert('Error al guardar los datos bancarios.');
    } finally {
      setSavingBankData(false);
    }
  };

  if (loading) return <div className="admin-p-loader">Cargando cobros pendientes...</div>;

  return (
    <div className="admin-payments-container">
      
      {/* HEADER ACTUALIZADO CON BOTÓN DE CONFIGURACIÓN */}
      <div className="admin-p-header">
        <div className="header-titles">
          <h1>Cobros Pendientes ({payments.length})</h1>
          <p>Verifica los comprobantes y aprueba los accesos a los planes.</p>
        </div>
        <button className="config-bank-btn" onClick={() => setIsBankModalOpen(true)}>
          <Settings size={18} /> Datos Bancarios
        </button>
      </div>

      <div className="payments-grid">
        {payments.length === 0 ? (
          <div className="empty-payments">
            <DollarSign size={40} className="empty-icon" />
            <p>No hay transferencias pendientes de revisión.</p>
          </div>
        ) : (
          payments.map(pay => (
            <div key={pay.id} className="payment-card">
              <div className="pay-card-header">
                <div>
                  <h3 className="pay-user-name">{pay.user.name}</h3>
                  <span className="pay-user-email">{pay.user.email}</span>
                </div>
                <div className="pay-amount-badge">
                  {formatPrice(pay.amount)}
                </div>
              </div>

              <div className="pay-card-body">
                <p><strong>Plan:</strong> {pay.plan.title}</p>
                <p><strong>Fecha:</strong> {new Date(pay.createdAt).toLocaleDateString()}</p>
                
                <button className="view-receipt-btn" onClick={() => setSelectedReceipt(pay.receiptUrl)}>
                  <Eye size={16} /> Ver Comprobante
                </button>
              </div>

              <div className="pay-card-actions">
                <button 
                  className="pay-action-btn reject" 
                  onClick={() => handleReject(pay.id)}
                  disabled={processingId === pay.id}
                >
                  <X size={18} /> Rechazar
                </button>
                <button 
                  className="pay-action-btn approve" 
                  onClick={() => handleApprove(pay.id)}
                  disabled={processingId === pay.id}
                >
                  {processingId === pay.id ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                  Aprobar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL PARA VER COMPROBANTE */}
      {selectedReceipt && (
        <div className="receipt-modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-receipt-btn" onClick={() => setSelectedReceipt(null)}>
              <X size={24} />
            </button>
            <img src={selectedReceipt} alt="Comprobante de pago" className="receipt-image" />
          </div>
        </div>
      )}

      {/* --- NUEVO: MODAL DE DATOS BANCARIOS --- */}
      {isBankModalOpen && (
        <div className="bank-modal-overlay">
          <div className="bank-modal-content">
            
            <div className="bank-modal-header">
              <div className="bm-title">
                <Landmark size={24} />
                <h2>Cuenta de Cobro</h2>
              </div>
              <button onClick={() => setIsBankModalOpen(false)} className="close-bm-btn"><X size={24}/></button>
            </div>

            <form onSubmit={handleSaveBankSettings} className="bank-modal-body">
              <p className="bm-desc">Estos datos son los que verán tus alumnos al elegir pagar por Transferencia en la app.</p>
              
              <div className="bm-input-group">
                <label>Titular de la cuenta</label>
                <input 
                  type="text" 
                  placeholder="Ej: Rocío Gómez"
                  value={bankData.name} 
                  onChange={(e) => setBankData({...bankData, name: e.target.value})}
                  required 
                />
              </div>

              <div className="bm-input-group">
                <label>Alias</label>
                <input 
                  type="text" 
                  placeholder="Ej: MI.ALIAS.MP"
                  value={bankData.alias} 
                  onChange={(e) => setBankData({...bankData, alias: e.target.value})}
                  required 
                />
              </div>

              <div className="bm-input-group">
                <label>CBU / CVU</label>
                <input 
                  type="text" 
                  placeholder="22 números"
                  value={bankData.cbu} 
                  onChange={(e) => setBankData({...bankData, cbu: e.target.value})}
                  required 
                />
              </div>

              <div className="bm-actions">
                <button type="button" className="bm-cancel" onClick={() => setIsBankModalOpen(false)}>Cancelar</button>
                <button type="submit" className="bm-save" disabled={savingBankData}>
                  {savingBankData ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPayments;