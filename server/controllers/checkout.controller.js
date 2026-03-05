import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { sendWelcomeEmail } from '../utils/mailer.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Config de MP
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

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
        isActive: true // La cuenta existe, pero la Suscripción es lo que le da acceso
      }
    });

    // 4. Enviar Mail de Bienvenida (No frena el proceso si falla)
    sendWelcomeEmail(newUser.email, newUser.name, paymentMethod);

    // 5. Bifurcación según Método de Pago
    
    // --- A. TRANSFERENCIA BANCARIA ---
    if (paymentMethod === 'TRANSFER') {
      if (!req.file) {
        return res.status(400).json({ error: 'Falta el comprobante de pago.' });
      }

      // Guardamos el pago como Pendiente
      await prisma.payment.create({
        data: {
          userId: newUser.id,
          planId: plan.id,
          amount: plan.price,
          currency: 'ARS',
          method: 'TRANSFERENCIA',
          status: 'PENDING',
          receiptUrl: req.file.path // Suponiendo que usás Cloudinary/Multer
        }
      });

      return res.json({ success: true, message: 'Usuario y pago registrado.' });
    }

    // --- B. MERCADO PAGO ---
    if (paymentMethod === 'MERCADOPAGO') {
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: [{
            id: String(plan.id),
            title: `Plan: ${plan.title}`,
            quantity: 1,
            unit_price: Number(plan.price),
            currency_id: 'ARS',
          }],
          back_urls: {
            success: "https://dont-quit-program.vercel.app/login", 
            failure: "https://dont-quit-program.vercel.app/login",
            pending: "https://dont-quit-program.vercel.app/login"
          },
          auto_return: "approved",
          notification_url: "https://dontquitprogram.onrender.com/api/payments/mp/webhook",
          metadata: {
            user_id: String(newUser.id),
            plan_id: String(plan.id)
          }
        }
      });

      // Le devolvemos la URL de MP al Frontend para que lo redirija
      return res.json({ success: true, initPoint: result.init_point });
    }

    // --- C. PAYPAL ---
    if (paymentMethod === 'PAYPAL') {
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
      const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST", body: "grant_type=client_credentials",
        headers: { Authorization: `Basic ${auth}` },
      });
      const tokenData = await tokenRes.json();

      // Creamos la orden
      const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            description: `Plan: ${plan.title}`,
            amount: { currency_code: "USD", value: plan.internationalPrice }
          }],
          // 👇 AGREGAMOS ESTO PARA QUE SEPA A DÓNDE VOLVER 👇
          application_context: {
            return_url: "https://dont-quit-program.vercel.app/login",
            cancel_url: "https://dont-quit-program.vercel.app/login"
          }
        }),
      });
      const orderData = await orderRes.json();
      
      const approveLink = orderData.links.find(link => link.rel === "approve").href;

      // Devolvemos el link y el ID del usuario que creamos recién
      return res.json({ success: true, initPoint: approveLink, userId: newUser.id });
    }

  } catch (error) {
    console.error("❌ Error en Checkout:", error);
    res.status(500).json({ error: 'Error interno al procesar la compra.' });
  }
};