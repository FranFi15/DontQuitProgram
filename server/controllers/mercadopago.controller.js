import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'; // 👈 ¡Agregamos Payment acá!
import prisma from '../db.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export const createPreference = async (req, res) => {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("Falta el MP_ACCESS_TOKEN en el archivo .env");
    }

    const { title, price, planId, userId } = req.body;

    if (!price || Number(price) <= 0) {
      throw new Error("El precio del plan no es válido para Mercado Pago.");
    }

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [
          {
            id: String(planId),
            title: `Plan: ${title}`,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'ARS',
          }
        ],
        // 👇 1. URLs ACTUALIZADAS A VERCEL (Tu Frontend) 👇
        back_urls: {
          success: "https://dont-quit-program.vercel.app/login", 
          failure: "https://dont-quit-program.vercel.app/login",
          pending: "https://dont-quit-program.vercel.app/login"
        },
        // 👇 2. VOLVEMOS A PRENDER EL RETORNO AUTOMÁTICO 👇
        auto_return: "approved",
        
        // 👇 3. FORZAMOS A MP A AVISARLE A RENDER (Tu Backend) 👇
        notification_url: "https://dontquitprogram.onrender.com/api/payments/mp/webhook",
        
        metadata: {
          user_id: String(userId),
          plan_id: String(planId)
        }
      }
    });

    res.json({ 
      id: result.id, 
      init_point: result.init_point 
    });

  } catch (error) {
    console.error("❌ Error de Mercado Pago:", error.message || error);
    res.status(500).json({ error: "Error al generar el link de pago" });
  }
};

export const receiveWebhook = async (req, res) => {
  // 1. Le decimos a MP "Recibido" rapidísimo para que no reintente
  res.status(200).send("OK");

  try {
    const type = req.query.topic || req.body.type || req.body.action;
    const paymentId = req.query.id || req.body.data?.id;

    if ((type === 'payment' || type === 'payment.created' || type === 'payment.updated') && paymentId) {
      
      const paymentClient = new Payment(client);
      const paymentInfo = await paymentClient.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const userId = parseInt(paymentInfo.metadata.user_id);
        const planId = parseInt(paymentInfo.metadata.plan_id);

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return; // Si no hay plan, cortamos acá

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (plan.duration * 7) + 14);

        const receiptCode = `MP-${paymentId}`;

        try {
          // 2. LA MAGIA ESTÁ ACÁ: Usamos una Transacción
          // Si el receiptUrl ya existe en otro pago, la base de datos va a frenar todo el bloque automáticamente.
          await prisma.$transaction(async (tx) => {
            
            // Verificamos dentro de la transacción si ya existe
            const existing = await tx.payment.findFirst({
              where: { receiptUrl: receiptCode }
            });

            if (existing) {
               console.log(`⚠️ Webhook duplicado frenado para el pago ${paymentId}`);
               return; // Cortamos la ejecución de la transacción
            }

            // Si no existe, creamos el pago
            await tx.payment.create({
              data: {
                userId,
                planId,
                amount: paymentInfo.transaction_amount,
                status: 'APPROVED',
                method: 'MERCADOPAGO',
                receiptUrl: receiptCode, 
              }
            });

            // Y creamos la suscripción
            await tx.subscription.create({
              data: {
                userId,
                planId,
                startDate,
                endDate,
                isActive: true
              }
            });
            
            console.log(`✅ ¡ÉXITO! Acceso otorgado al usuario ${userId} por MP.`);
          });

        } catch (dbError) {
          console.error(`⚠️ Error en la base de datos al guardar pago ${paymentId} (Posible duplicado):`, dbError.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error procesando webhook de MP:", error);
  }
};