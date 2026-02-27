import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Check, X, Eye, DollarSign, Loader2, Settings, Landmark, History, Clock } from 'lucide-react';
import './AdminPayments.css';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // --- ESTADO PARA CONTROLAR LA PESTAÑA ---
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' o 'history'

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankData, setBankData] = useState({ alias: '', cbu: '', name: '' });
  const [savingBankData, setSavingBankData] = useState(false);

  // Traer todos los pagos (pendientes y aprobados/rechazados)
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/payments/pending' : '/payments/history';
      const res = await axios.get(endpoint);
      setPayments(res.data);
    } catch (error) {
      console.error("Error cargando pagos", error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [activeTab]); // Se recarga cuando cambias de pestaña

  // --- FORMATEO DINÁMICO DE MONEDA ---
  const formatAmount = (amount, currency, method) => {
    const curr = currency || (method === 'PAYPAL' ? 'USD' : 'ARS');
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: curr, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("¿Confirmas que recibiste el dinero? Esto le dará acceso inmediato al plan.")) return;
    setProcessingId(id);
    try {
      await axios.put(`/payments/${id}/approve`);
      alert("✅ Pago aprobado.");
      fetchPayments(); 
    } catch (error) {
      alert("Error al aprobar");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("¿Deseas rechazar este pago?")) return;
    setProcessingId(id);
    try {
      await axios.put(`/payments/${id}/reject`);
      fetchPayments();
    } catch (error) {
      alert("Error al rechazar");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveBankSettings = async (e) => {
    e.preventDefault();
    setSavingBankData(true);
    try {
      await axios.put('/settings/bank', bankData);
      alert('✅ Datos actualizados.');
      setIsBankModalOpen(false);
    } catch (error) {
      alert('Error al guardar.');
    } finally {
      setSavingBankData(false);
    }
  };

  return (
    <div className="admin-payments-container">
      
      <div className="admin-p-header">
        <div className="header-titles">
          <h1>Gestión de Cobros</h1>
          <p>Control de ingresos por Transferencia, Mercado Pago y PayPal.</p>
        </div>
        <button className="config-bank-btn" onClick={() => setIsBankModalOpen(true)}>
          <Settings size={18} /> Configurar CBU
        </button>
      </div>

      {/* --- SELECTOR DE PESTAÑAS --- */}
      <div className="admin-p-tabs">
        <button 
          className={`p-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} /> Pendientes Revisión
        </button>
        <button 
          className={`p-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Historial de Pagos
        </button>
      </div>

      {loading ? (
        <div className="admin-p-loader">Cargando información...</div>
      ) : (
        <div className="payments-grid">
          {payments.length === 0 ? (
            <div className="empty-payments">
              <DollarSign size={40} className="empty-icon" />
              <p>No hay registros para mostrar en esta sección.</p>
            </div>
          ) : (
            payments.map(pay => (
              <div key={pay.id} className={`payment-card ${pay.status.toLowerCase()}`}>
                <div className="pay-card-header">
                  <div>
                    <h3 className="pay-user-name">{pay.user.name}</h3>
                    <span className="method-tag">{pay.method}</span>
                  </div>
                  <div className={`pay-amount-badge ${pay.currency === 'USD' ? 'usd' : ''}`}>
                    {formatAmount(pay.amount, pay.currency, pay.method)}
                  </div>
                </div>

                <div className="pay-card-body">
                  <p><strong>Plan:</strong> {pay.plan.title}</p>
                  <p><strong>Fecha:</strong> {new Date(pay.createdAt).toLocaleDateString()}</p>
                  
                  {pay.method === 'TRANSFER' && pay.receiptUrl && (
                    <button className="view-receipt-btn" onClick={() => setSelectedReceipt(pay.receiptUrl)}>
                      <Eye size={16} /> Ver Comprobante
                    </button>
                  )}

                  {pay.method !== 'TRANSFER' && (
                    <div className="auto-pay-info">
                      <Check size={14} /> Pago Automático
                    </div>
                  )}
                </div>

                {/* Mostrar acciones solo si está pendiente */}
                {pay.status === 'PENDING' && (
                  <div className="pay-card-actions">
                    <button className="pay-action-btn reject" onClick={() => handleReject(pay.id)} disabled={processingId === pay.id}>
                      <X size={18} /> Rechazar
                    </button>
                    <button className="pay-action-btn approve" onClick={() => handleApprove(pay.id)} disabled={processingId === pay.id}>
                      {processingId === pay.id ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                      Aprobar
                    </button>
                  </div>
                )}

                {/* Badge de estado para el historial */}
                {pay.status !== 'PENDING' && (
                  <div className={`status-footer ${pay.status.toLowerCase()}`}>
                    {pay.status === 'APPROVED' ? 'PAGO APROBADO' : 'PAGO RECHAZADO'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL COMPROBANTE */}
      {selectedReceipt && (
        <div className="receipt-modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-receipt-btn" onClick={() => setSelectedReceipt(null)}><X size={24} /></button>
            <img src={selectedReceipt} alt="Comprobante" className="receipt-image" />
          </div>
        </div>
      )}

      {/* MODAL BANCO */}
      {isBankModalOpen && (
        <div className="bank-modal-overlay">
          <div className="bank-modal-content">
            <div className="bank-modal-header">
              <div className="bm-title"><Landmark size={24} /><h2>Cuenta de Cobro</h2></div>
              <button onClick={() => setIsBankModalOpen(false)} className="close-bm-btn"><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveBankSettings} className="bank-modal-body">
              <div className="bm-input-group">
                <label>Titular</label>
                <input type="text" value={bankData.name} onChange={(e) => setBankData({...bankData, name: e.target.value})} required />
              </div>
              <div className="bm-input-group">
                <label>Alias</label>
                <input type="text" value={bankData.alias} onChange={(e) => setBankData({...bankData, alias: e.target.value})} required />
              </div>
              <div className="bm-input-group">
                <label>CBU / CVU</label>
                <input type="text" value={bankData.cbu} onChange={(e) => setBankData({...bankData, cbu: e.target.value})} required />
              </div>
              <div className="bm-actions">
                <button type="button" className="bm-cancel" onClick={() => setIsBankModalOpen(false)}>Cancelar</button>
                <button type="submit" className="bm-save" disabled={savingBankData}>
                  {savingBankData ? 'Guardando...' : 'Guardar'}
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