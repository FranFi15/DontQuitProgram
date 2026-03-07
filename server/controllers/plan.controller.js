import prisma from '../db.js';

// Obtener todos los planes
export const getAllPlans = async (req, res) => {
  try {
    // 1. Obtener TODOS los planes (Activos y Pausados)
    const plans = await prisma.plan.findMany({
      include: { 
        planType: true,
        subscriptions: { where: { isActive: true } } // Opcional: para contar bien los alumnos
      },
      orderBy: { id: 'desc' } // Para que los más nuevos salgan primero
    });

    // 2. Obtener el Límite Máximo configurado
    const limitSetting = await prisma.systemSetting.findUnique({
      where: { key: 'max_followup_slots' }
    });
    const maxSlots = limitSetting ? parseInt(limitSetting.value) : 50;

    // 3. Contar cuánta gente hay AHORA con seguimiento activo
    const currentOccupied = await prisma.subscription.count({
      where: {
        isActive: true,
        plan: { hasFollowUp: true },
        OR: [
          { endDate: { gt: new Date() } },
          { endDate: null }
        ]
      }
    });

    const isFollowUpFull = currentOccupied >= maxSlots;

    // 4. Mapear los planes
    const plansWithStock = plans.map(plan => {
      let outOfStock = false;
      if (plan.hasFollowUp && isFollowUpFull) {
        outOfStock = true;
      }

      return {
        ...plan,
        outOfStock, 
        stockReason: outOfStock ? 'Cupos de seguimiento agotados' : null
      };
    });

    res.json(plansWithStock);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
};

// Obtener un plan por ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(id) },
      include: {
        workouts: true,
        planType: true // Incluimos info del tipo también aquí
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el plan' });
  }
};

// createPlan
export const createPlan = async (req, res) => {
  try {
    // 1. AGREGAMOS transferDiscount AQUÍ
    const { title, description, price, duration, internationalPrice, transferDiscount, planTypeId, hasFollowUp } = req.body;

   if (!title || price === undefined || price === null || price < 0) {
      return res.status(400).json({ error: 'El Título es obligatorio y el Precio no puede ser negativo.' });
    }

    const newPlan = await prisma.plan.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        internationalPrice: parseFloat(internationalPrice || 0),
        transferDiscount: parseInt(transferDiscount || 0), 
        duration: parseInt(duration) || 1,
        planTypeId: planTypeId ? parseInt(planTypeId) : null,
        levelDefinitions: "[]",
        hasFollowUp: hasFollowUp || false, 
      },
    });
    res.json(newPlan);
  } catch (error) { 
      console.error(error);
      res.status(500).json({ error: 'Error al crear el plan' });
  }
};

// updatePlan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    // 1. AGREGAMOS transferDiscount AQUÍ TAMBIÉN
    const { title, description, price, duration, internationalPrice, transferDiscount, planTypeId, hasFollowUp } = req.body;

    const updatedPlan = await prisma.plan.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        price: parseFloat(price),
        internationalPrice: parseFloat(internationalPrice || 0),
        transferDiscount: parseInt(transferDiscount || 0), // 2. ACTUALIZAMOS EL DESCUENTO
        duration: parseInt(duration),
        planTypeId: planTypeId ? parseInt(planTypeId) : null,
        hasFollowUp: hasFollowUp, 
      },
    });
    res.json(updatedPlan);
  } catch (error) { 
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el plan' });
  }
};

// deletePlan (LA VERSIÓN SEGURA QUE HABLAMOS)
export const deletePlan = async (req, res) => {
  try {
    const planId = parseInt(req.params.id);

    // 1. Verificamos si hay alumnos ACTUALMENTE cursando este plan
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: planId,
        isActive: true,
        endDate: { gt: new Date() } // Que sigan vigentes
      }
    });

    // Si hay alumnos entrenando hoy con este plan, bloqueamos el borrado
    if (activeSubscriptions > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${activeSubscriptions} alumno(s) usando este plan actualmente. Usa la opción de 'Pausar' para sacarlo de venta.` 
      });
    }

    // 2. Si no hay alumnos activos, ejecutamos la PURGA TOTAL en una sola transacción.
    // El orden es fundamental: primero borramos los "hijos" que dependen del plan, y por último el plan.
    await prisma.$transaction([
      
      // A. Borramos todos los pagos asociados a este plan en el historial
      prisma.payment.deleteMany({
        where: { planId: planId }
      }),

      // B. Borramos todas las suscripciones (incluso las vencidas/viejas) de este plan
      prisma.subscription.deleteMany({
        where: { planId: planId }
      }),

      // C. Borramos el historial de feedback/resultados de los entrenamientos de este plan
      // (Primero buscamos los IDs de las rutinas de este plan)
      prisma.workoutResult.deleteMany({
        where: { workout: { planId: planId } }
      }),

      // D. Borramos todas las rutinas (Workouts/Semanas/Días) creadas adentro del plan
      prisma.workout.deleteMany({
        where: { planId: planId }
      }),

      // E. Borramos las "cajas" de puntaje/métricas asociadas a este plan
      prisma.scoreBox.deleteMany({
        where: { planId: planId }
      }),

      // F. Finalmente, borramos el Plan en sí mismo
      prisma.plan.delete({
        where: { id: planId }
      })
    ]);
    
    res.json({ message: 'Plan y todo su historial han sido eliminados correctamente.' });

  } catch (error) {
    console.error("Error al ejecutar purga del plan:", error);
    res.status(500).json({ error: 'Error interno al intentar eliminar el plan y sus dependencias.' });
  }
};

export const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el plan actual
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    // 2. Invertimos el estado (Si es true pasa a false, y viceversa)
    const updatedPlan = await prisma.plan.update({
      where: { id: parseInt(id) },
      data: { 
        isActive: !plan.isActive 
      }
    });

    const statusMessage = updatedPlan.isActive ? "Plan activado (En stock)" : "Plan pausado (Sin stock)";
    res.json({ message: statusMessage, plan: updatedPlan });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar el estado del plan" });
  }
};

export const duplicatePlan = async (req, res) => {
  try {
    const { id } = req.params; // ID del plan original
    const { 
      newTitle, 
      newPrice, 
      newInternationalPrice, 
      newTransferDiscount, 
      newHasFollowUp 
    } = req.body;

    // 1. Buscamos el plan original CON todas sus rutinas
    const originalPlan = await prisma.plan.findUnique({
      where: { id: parseInt(id) },
      include: { workouts: true }
    });

    if (!originalPlan) {
      return res.status(404).json({ error: "El plan original no existe." });
    }

    // 2. Creamos el nuevo plan usando la info original, pero pisando los precios/títulos
    const duplicatedPlan = await prisma.plan.create({
      data: {
        title: newTitle || `${originalPlan.title} (Copia)`,
        description: originalPlan.description,
        duration: originalPlan.duration,
        levelDefinitions: originalPlan.levelDefinitions,
        planTypeId: originalPlan.planTypeId,
        
        // Valores nuevos proporcionados por Rocío
        price: parseFloat(newPrice),
        internationalPrice: parseFloat(newInternationalPrice || 0),
        transferDiscount: parseInt(newTransferDiscount || 0),
        hasFollowUp: newHasFollowUp || false,
        isActive: false, 
        
        workouts: {
          create: originalPlan.workouts.map(workout => ({
            weekNumber: workout.weekNumber,
            dayNumber: workout.dayNumber,
            title: workout.title,
            blocks: workout.blocks
          }))
        }
      }
    });

    res.json({ message: "Plan duplicado con éxito", plan: duplicatedPlan });

  } catch (error) {
    console.error("Error al duplicar el plan:", error);
    res.status(500).json({ error: "Error interno al duplicar el plan y sus rutinas." });
  }
};