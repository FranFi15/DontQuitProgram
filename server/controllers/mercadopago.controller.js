import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../db.js';
import { sendPurchaseConfirmationEmail } from '../utils/mailer.js'; 

export const createPreference = async (req, res) => {
  try {
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.trim() === '') {
      throw new Error("Falta el MP_ACCESS_TOKEN en el archivo .env");
    }

    // 👇 1. INICIALIZAMOS EL CLIENTE ACÁ ADENTRO CON .trim()
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN.trim() 
    });

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
        back_urls: {
          success: "https://dontquitprogram.com/login", 
          failure: "https://dontquitprogram.com/login",
          pending: "https://dontquitprogram.com/login"
        },
        auto_return: "approved",
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
  res.status(200).send("OK");

  try {
    const type = req.query.topic || req.body.type || req.body.action;
    const paymentId = req.query.id || req.body.data?.id;

    if ((type === 'payment' || type === 'payment.created' || type === 'payment.updated') && paymentId) {
      
      // 👇 2. INICIALIZAMOS EL CLIENTE ACÁ TAMBIÉN CON .trim()
      const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN.trim() 
      });
      const paymentClient = new Payment(client);
      const paymentInfo = await paymentClient.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const userId = parseInt(paymentInfo.metadata.user_id);
        const planId = parseInt(paymentInfo.metadata.plan_id);
        const receiptCode = `MP-${paymentId}`; 

        try {
          // 👇 3. CORRECCIÓN CRÍTICA: Buscamos plan Y user al mismo tiempo
          const [plan, user] = await Promise.all([
            prisma.plan.findUnique({ where: { id: planId } }),
            prisma.user.findUnique({ where: { id: userId } })
          ]);

          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan.duration * 7) + 14);

          await prisma.$transaction([
            prisma.payment.create({
              data: {
                userId,
                planId,
                amount: paymentInfo.transaction_amount,
                status: 'APPROVED',
                method: 'MERCADOPAGO',
                receiptUrl: receiptCode, 
              }
            }),
            prisma.subscription.create({
              data: {
                userId,
                planId,
                startDate,
                endDate,
                isActive: true
              }
            })
          ]);

          console.log(`✅ ¡ÉXITO! Acceso otorgado al usuario ${userId} por MP.`);

          // 👇 Ahora sí enviamos el mail, porque "user" ya existe
          await sendPurchaseConfirmationEmail(user.email, user.name, plan.title);

        } catch (dbError) {
          if (dbError.code === 'P2002') {
            console.log(`🛡️ Webhook duplicado frenado por la base de datos (Pago: ${paymentId})`);
          } else {
            console.error(`❌ Error guardando en BD:`, dbError);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error procesando webhook de MP:", error);
  }
};