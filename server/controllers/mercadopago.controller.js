import { MercadoPagoConfig, Preference } from 'mercadopago';
import prisma from '../db.js';

// 1. Inicializamos Mercado Pago con el Access Token de Rocío
// Idealmente, pon este token en tu archivo .env como MP_ACCESS_TOKEN
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export const createPreference = async (req, res) => {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("Falta el MP_ACCESS_TOKEN en el archivo .env");
    }

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN 
    });

    const { title, price, planId, userId } = req.body;

    if (!price || Number(price) <= 0) {
      throw new Error("El precio del plan no es válido para Mercado Pago.");
    }

    const preference = new Preference(client);
    
    // Armamos el cuerpo exacto que pide Mercado Pago
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
        // AQUÍ ESTÁ LA CLAVE: URLs limpias para evitar que el validador de MP las rechace
        back_urls: {
          success: "http://localhost:5173/client/store", 
          failure: "http://localhost:5173/client/store",
          pending: "http://localhost:5173/client/store"
        },
        //auto_return: "approved",
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
  // 1. MP exige que le respondamos "OK" (Estado 200) inmediatamente, si no, sigue intentando.
  res.status(200).send("OK");

  try {
    const type = req.query.topic || req.body.type;
    const paymentId = req.query.id || req.body.data?.id;

    // 2. Verificamos si la notificación es de un pago creado/actualizado
    if (type === 'payment' && paymentId) {
      
      // 3. Vamos a buscar los detalles de ese pago a Mercado Pago
      const paymentClient = new Payment(client);
      const paymentInfo = await paymentClient.get({ id: paymentId });

      // 4. ¿El pago fue APROBADO?
      if (paymentInfo.status === 'approved') {
        const userId = parseInt(paymentInfo.metadata.user_id);
        const planId = parseInt(paymentInfo.metadata.plan_id);

        // 5. Verificamos que no hayamos procesado este pago antes (por las dudas MP avise 2 veces)
        const existingPayment = await prisma.payment.findFirst({
          where: { receiptUrl: `MP-${paymentId}` } 
        });

        if (!existingPayment) {
          // 6. ¡Magia! Registramos la plata que entró
          await prisma.payment.create({
            data: {
              userId,
              planId,
              amount: paymentInfo.transaction_amount,
              status: 'APPROVED',
              method: 'MERCADOPAGO',
              receiptUrl: `MP-${paymentId}`, // Usamos esto para guardar el ID único de MP
            }
          });

          // 7. Le damos acceso al alumno al plan instantáneamente
          const plan = await prisma.plan.findUnique({ where: { id: planId } });
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan.duration * 7) + 14); // Duración + 2 semanas

          await prisma.subscription.create({
            data: {
              userId,
              planId,
              startDate,
              endDate,
              isActive: true
            }
          });
          
          console.log(`✅ ¡ÉXITO! Acceso otorgado al usuario ${userId} por MP.`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error procesando webhook de MP:", error);
  }
};