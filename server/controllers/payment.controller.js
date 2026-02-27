import prisma from '../db.js';

// --- CLIENTE: REPORTAR UNA TRANSFERENCIA ---
export const reportTransfer = async (req, res) => {
  try {
    const { userId, planId, amount, receiptUrl } = req.body;

    if (!receiptUrl) {
      return res.status(400).json({ error: "El comprobante es obligatorio." });
    }

    // Creamos el pago con estado PENDING (Pendiente)
    const newPayment = await prisma.payment.create({
      data: {
        userId: parseInt(userId),
        planId: parseInt(planId),
        amount: parseFloat(amount),
        currency: 'ARS', // Asumimos ARS para transferencias
        method: 'TRANSFERENCIA',
        status: 'PENDING',
        receiptUrl
      }
    });

    res.json({ 
      message: 'Pago reportado con éxito. En espera de aprobación de Ro.', 
      payment: newPayment 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reportar el pago' });
  }
};

// --- ADMIN: OBTENER PAGOS PENDIENTES ---
export const getPendingPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pagos' });
  }
};

// --- ADMIN: APROBAR PAGO Y CREAR SUSCRIPCIÓN ---
export const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el pago y los detalles del plan
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { plan: true }
    });

    if (!payment || payment.status !== 'PENDING') {
      return res.status(400).json({ error: "El pago no existe o ya fue procesado." });
    }

    // 2. Calculamos la fecha de fin (IGUAL QUE EN SUBSCRIPTION CONTROLLER)
    const startDate = new Date();
    const weeksTotal = (payment.plan.duration || 4) + 2; // Sumamos las 2 semanas extra
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weeksTotal * 7));

    // 3. Hacemos dos cosas a la vez (Transacción)
    const [updatedPayment, newSubscription] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED' }
      }),
      prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          startDate: startDate, // Usamos la fecha que creamos arriba
          endDate: endDate,     // Usamos la fecha calculada con las semanas extra
          isActive: true
        }
      })
    ]);

    // Opcional pero recomendado: Asegurarnos de que el perfil del usuario esté Activo
    await prisma.user.update({
      where: { id: payment.userId },
      data: { isActive: true }
    });

    res.json({ message: "Pago aprobado. El alumno ya tiene acceso al plan." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aprobar el pago' });
  }
};

// --- ADMIN: RECHAZAR PAGO ---
export const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' }
    });
    res.json({ message: "Pago rechazado." });
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar el pago' });
  }
};

// --- ADMIN: CONTADOR MAESTRO DE NOTIFICACIONES ---
export const getAdminBadges = async (req, res) => {
  try {
    // 1. Cobros Pendientes
    const pendingPayments = await prisma.payment.count({
      where: { status: 'PENDING' }
    });

    // 2. Chat: Mensajes sin leer dirigidos a Ro (Admin ID: 1)
    // Cambia 'message' por el nombre de tu tabla de chat en Prisma
    const unreadMessages = await prisma.message.count({
      where: { 
        receiverId: 1, 
        isRead: false // Asumiendo que tienes este campo en tu BD
      }
    });

    // 3. Muro: Posteos pendientes de aprobación
    // Cambia 'wallPost' por el nombre de tu tabla del muro
    const pendingWallPosts = await prisma.wallPost.count({
      where: { status: 'PENDING' } // Asumiendo que requieren aprobación
    });

    res.json({ 
      payments: pendingPayments,
      chat: unreadMessages,
      wall: pendingWallPosts
    });
  } catch (error) {
    console.error("Error contando notificaciones:", error);
    res.status(500).json({ error: 'Error contando notificaciones' });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const history = await prisma.payment.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: 'Error obteniendo historial de pagos' });
  }
};