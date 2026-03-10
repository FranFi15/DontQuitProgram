import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { sendWelcomeEmail } from '../utils/mailer.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// ❌ ACÁ ESTABA EL ERROR: BORRAMOS EL "const client = ..." GLOBAL

export const processCheckout = async (req, res) => {
  try {
    const { planId, name, email, password, phone, paymentMethod } = req.body;

    // 1. Validar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado. Por favor, iniciá sesión.' });
    }

    // 2. Traer el precio del plan
    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });

    // 3. Crear el Usuario (Inactivo en cuanto a suscripciones, pero puede loguearse)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'ATLETA',
        isActive: true 
      }
    });

    // 4. Enviar Mail de Bienvenida (No frena el proceso si falla)
    sendWelcomeEmail(newUser.email, newUser.name, paymentMethod);

    // 5. Bifurcación según Método de Pago
    
    // --- PLAN GRATUITO ---
    if (plan.price === 0) {
      await prisma.subscription.create({
        data: {
          userId: newUser.id,
          planId: plan.id,
          isActive: true,
          endDate: new Date(new Date().getTime() + (plan.duration + 2) * 7 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.payment.create({
        data: {
          userId: newUser.id,
          planId: plan.id,
          amount: 0,
          currency: 'ARS',
          method: 'GRATUITO',
          status: 'APPROVED',
        }
      });

      return res.json({ success: true, isFree: true });
    }

    // --- A. TRANSFERENCIA BANCARIA ---
    if (paymentMethod === 'TRANSFER') {
      if (!req.file) {
        return res.status(400).json({ error: 'Falta el comprobante de pago.' });
      }

      await prisma.payment.create({
        data: {
          userId: newUser.id,
          planId: plan.id,
          amount: plan.price,
          currency: 'ARS',
          method: 'TRANSFERENCIA',
          status: 'PENDING',
          receiptUrl: req.file.path
        }
      });

      return res.json({ success: true, message: 'Usuario y pago registrado.' });
    }

    // --- B. MERCADO PAGO ---
    if (paymentMethod === 'MERCADOPAGO') {
      if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.trim() === '') {
        return res.status(500).json({ error: "Falta configurar la pasarela de pago." });
      }

      // 👇 ACÁ ESTÁ LA MAGIA: Limpiamos la clave y armamos el cliente ADENTRO de la función
      const cleanToken = process.env.MP_ACCESS_TOKEN.trim();
      const clientMP = new MercadoPagoConfig({ accessToken: cleanToken });
      const preference = new Preference(clientMP);

      try {
        const payloadMP = {
          body: {
            items: [{
              id: String(plan.id),
              title: `Plan: ${plan.title}`,
              quantity: 1,
              unit_price: Number(plan.price),
              currency_id: 'ARS',
            }],
            back_urls: {
              success: "https://dontquitprogram.com/login", 
              failure: "https://dontquitprogram.com/login",
              pending: "https://dontquitprogram.com/login"
            },
            auto_return: "approved",
            notification_url: "https://dontquitprogram.onrender.com/api/payments/mp/webhook",
            metadata: {
              user_id: String(newUser.id),
              plan_id: String(plan.id)
            }
          }
        };

        const result = await preference.create(payloadMP);
        return res.json({ success: true, initPoint: result.init_point });

      } catch (mpError) {
        console.error("❌ Error CRÍTICO devuelto por Mercado Pago:", mpError);
        return res.status(500).json({ error: "Mercado Pago rechazó la solicitud. Revisá la consola." });
      }
    }

    // --- C. PAYPAL ---
    if (paymentMethod === 'PAYPAL') {
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
      const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST", body: "grant_type=client_credentials",
        headers: { Authorization: `Basic ${auth}` },
      });
      const tokenData = await tokenRes.json();

      // Creamos la orden
      const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            description: `Plan: ${plan.title}`,
            amount: { currency_code: "USD", value: plan.internationalPrice }
          }],
          application_context: {
            return_url: "https://dontquitprogram.com/login",
            cancel_url: "https://dontquitprogram.com/login",
          }
        }),
      });
      
      const orderData = await orderRes.json();
      
      if (!orderData.links) {
        console.error("❌ Error de PayPal (Respuesta cruda):", orderData);
        return res.status(400).json({ error: "No se pudo conectar con PayPal. Revisá las credenciales en Render." });
      }

      const approveLink = orderData.links.find(link => link.rel === "approve").href;

      return res.json({ success: true, initPoint: approveLink, userId: newUser.id });
    }

  } catch (error) {
    console.error("❌ Error en Checkout:", error);
    res.status(500).json({ error: 'Error interno al procesar la compra.' });
  }
};