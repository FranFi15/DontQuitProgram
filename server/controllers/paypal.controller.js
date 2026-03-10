import prisma from '../db.js';
import { sendPurchaseConfirmationEmail } from '../utils/mailer.js';

// 1. Función interna: Le pide la "llave de paso" temporal a PayPal
const generateAccessToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await response.json();
  return data.access_token;
};

// 2. CREAR ORDEN
export const createOrder = async (req, res) => {
  try {
    const { price, title } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: `Plan: ${title}`,
            amount: { 
              currency_code: "USD", 
              value: price 
            } 
          }
        ],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error creando orden PayPal:", error);
    res.status(500).json({ error: "Error al crear orden de PayPal" });
  }
};

// 3. CAPTURAR PAGO: Corregido para manejar la moneda USD
export const captureOrder = async (req, res) => {
  try {
    const { orderID, userId, planId } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.status === "COMPLETED") {
      // Extraemos los datos exactos del pago capturado
      const capture = data.purchase_units[0].payments.captures[0];
      const amountValue = parseFloat(capture.amount.value);
      const currencyCode = capture.amount.currency_code; // Esto será "USD"

      // Registramos el pago indicando explícitamente la moneda
      await prisma.payment.create({
        data: {
          userId: Number(userId),
          planId: Number(planId),
          amount: amountValue,
          currency: currencyCode, // 👈 Aquí forzamos que guarde "USD"
          status: 'APPROVED',
          method: 'PAYPAL',
          receiptUrl: `PP-${orderID}`, 
        }
      });

      // Activamos la suscripción
      const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
      const startDate = new Date();
      const endDate = new Date();
      // Duración + 2 semanas de gracia
      endDate.setDate(endDate.getDate() + (plan.duration * 7) + 14); 

      await prisma.subscription.create({
        data: {
          userId: Number(userId),
          planId: Number(planId),
          startDate,
          endDate,
          isActive: true
        }
      });

      await sendPurchaseConfirmationEmail(user.email, user.name, plan.title);

      res.json({ success: true, message: "Pago procesado en USD y suscripción activada." });
    } else {
      res.status(400).json({ error: "El pago no se pudo completar." });
    }
  } catch (error) {
    console.error("❌ Error capturando orden PayPal:", error);
    res.status(500).json({ error: "Error al capturar el pago" });
  }
};