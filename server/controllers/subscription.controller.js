import prisma from '../db.js';


export const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { title: true, duration: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { userId, planId, startDate } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    // CREACIÓN SEGURA DE FECHAS
    // Si manda fecha, la usamos (con hora 00:00 local). Si no, usamos el momento exacto actual.
    const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    
    // Calculamos fecha de fin (Semanas + 2 Extra)
    const weeksTotal = (plan.duration || 4) + 2; 
    
    const end = new Date(start);
    // Para sumar semanas exactas (7 días)
    end.setDate(end.getDate() + (weeksTotal * 7));

    const newSub = await prisma.subscription.create({
      data: {
        userId: parseInt(userId),
        planId: parseInt(planId),
        startDate: start,
        endDate: end,
        isActive: true
      }
    });

    await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { isActive: true }
    });

    res.json(newSub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear suscripción' });
  }
};


export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subscription.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    res.json({ message: 'Suscripción cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar' });
  }
};

export const getSubscriptionsByPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const subs = await prisma.subscription.findMany({
      where: { 
        planId: parseInt(planId),
        isActive: true 
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(subs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener alumnos del plan' });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, startDate } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    // Misma corrección de fecha
    const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    const weeksTotal = (plan.duration || 4) + 2;
    const end = new Date(start);
    end.setDate(end.getDate() + (weeksTotal * 7));

    const updatedSub = await prisma.subscription.update({
      where: { id: parseInt(id) },
      data: {
        planId: parseInt(planId),
        startDate: start,
        endDate: end
      }
    });

    res.json(updatedSub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar suscripción' });
  }
};