import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'; // 👈 ¡Agregamos Payment acá!
import prisma from '../db.js';
import { sendPurchaseConfirmationEmail } from '../utils/mailer.js'; 

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
        const receiptCode = `MP-${paymentId}`; // Este es el valor ÚNICO

        try {
          const plan = await prisma.plan.findUnique({ where: { id: planId } });
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan.duration * 7) + 14);

          // Disparamos la creación en bloque. Si receiptCode ya existe en la BD, falla todo automáticamente.
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

          await sendPurchaseConfirmationEmail(user.email, user.name, plan.title);

        } catch (dbError) {
          // Si el error es P2002, significa que el candado de la BD funcionó y frenó al duplicado.
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