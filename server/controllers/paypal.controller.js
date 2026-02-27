import prisma from '../db.js';

// 1. Función interna: Le pide la "llave de paso" temporal a PayPal
const generateAccessToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await response.json();
  return data.access_token;
};

// 2. CREAR ORDEN: El frontend llama a esta ruta justo cuando el cliente hace clic en "Pagar"
export const createOrder = async (req, res) => {
  try {
    const { price, title } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
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
              currency_code: "USD", // PayPal cobra en dólares
              value: price 
            } 
          }
        ],
      }),
    });

    const data = await response.json();
    res.json(data); // Le devolvemos el ID de la orden a React
  } catch (error) {
    console.error("❌ Error creando orden PayPal:", error);
    res.status(500).json({ error: "Error al crear orden de PayPal" });
  }
};

// 3. CAPTURAR PAGO: El frontend llama a esta ruta cuando el cliente ya puso su tarjeta y aprobó
export const captureOrder = async (req, res) => {
  try {
    const { orderID, userId, planId } = req.body;
    const accessToken = await generateAccessToken();

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    // Si el pago se completó con éxito, hacemos la magia en la base de datos
    if (data.status === "COMPLETED") {
      
      // Registramos el pago
      await prisma.payment.create({
        data: {
          userId: Number(userId),
          planId: Number(planId),
          amount: parseFloat(data.purchase_units[0].payments.captures[0].amount.value),
          status: 'APPROVED',
          method: 'PAYPAL',
          receiptUrl: `PP-${orderID}`, 
        }
      });

      // Le damos la suscripción al alumno
      const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
      const startDate = new Date();
      const endDate = new Date();
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

      res.json({ success: true, message: "Pago procesado y suscripción activada." });
    } else {
      res.status(400).json({ error: "El pago no se pudo completar." });
    }
  } catch (error) {
    console.error("❌ Error capturando orden PayPal:", error);
    res.status(500).json({ error: "Error al capturar el pago" });
  }
};