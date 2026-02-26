// server/controllers/workoutController.js
import prisma from '../db.js';

// Obtener todas las rutinas de un plan (ordenadas por semana y día)
export const getPlanWorkouts = async (req, res) => {
  try {
    const { planId } = req.params;
    const workouts = await prisma.workout.findMany({
      where: { planId: parseInt(planId) },
      orderBy: [
        { weekNumber: 'asc' },
        { dayNumber: 'asc' }
      ]
    });
    res.json(workouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener rutinas' });
  }
};

// Crear o Editar un Día (Workout)
// Esto guarda los BLOQUES y EJERCICIOS dentro del campo JSON 'blocks'
export const saveWorkout = async (req, res) => {
  try {
    const { planId } = req.params;
    const { weekNumber, dayNumber, title, blocks } = req.body;

    // Usamos 'upsert': Si existe el día, lo actualiza. Si no, lo crea.
    const workout = await prisma.workout.upsert({
      where: {
        planId_weekNumber_dayNumber: {
          planId: parseInt(planId),
          weekNumber: parseInt(weekNumber),
          dayNumber: parseInt(dayNumber),
        }
      },
      update: {
        title,
        blocks: JSON.stringify(blocks || []),
      },
      create: {
        planId: parseInt(planId),
        weekNumber: parseInt(weekNumber),
        dayNumber: parseInt(dayNumber),
        title,
        blocks: JSON.stringify(blocks || []),
      }
    });

    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el día' });
  }
};

// Eliminar un día específico
export const deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workout.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Día eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar día' });
  }
};

// Eliminar una SEMANA completa (borra todos los días de esa semana)
export const deleteWeek = async (req, res) => {
  try {
    const { planId, weekNumber } = req.params;
    await prisma.workout.deleteMany({
      where: {
        planId: parseInt(planId),
        weekNumber: parseInt(weekNumber)
      }
    });
    res.json({ message: 'Semana eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar semana' });
  }
};

export const updateWeekNumber = async (req, res) => {
  try {
    const { planId, weekNumber } = req.params; // La semana actual (ej: 2)
    const { newWeekNumber } = req.body; // El número nuevo (ej: 1)

    // Validamos que no estemos intentando moverla a una semana que ya tiene datos
    const targetWeekExists = await prisma.workout.findFirst({
      where: {
        planId: parseInt(planId),
        weekNumber: parseInt(newWeekNumber)
      }
    });

    if (targetWeekExists) {
      return res.status(400).json({ error: `Ya existen datos en la Semana ${newWeekNumber}. Elige otro número.` });
    }

    // Actualizamos masivamente todos los días de esa semana
    await prisma.workout.updateMany({
      where: {
        planId: parseInt(planId),
        weekNumber: parseInt(weekNumber)
      },
      data: {
        weekNumber: parseInt(newWeekNumber)
      }
    });

    res.json({ message: 'Semana actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar semana' });
  }
};

export const updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayNumber, title } = req.body;

    await prisma.workout.update({
      where: { id: parseInt(id) },
      data: {
        ...(dayNumber && { dayNumber: parseInt(dayNumber) }),
        ...(title && { title }),
      }
    });

    res.json({ message: 'Día actualizado correctamente' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un día con ese número en esta semana.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el día' });
  }
};

export const getUserActivePlans = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true
      },
      include: {
        plan: true
      }
    });

    res.json(subscriptions.map(sub => ({
      planId: sub.planId,
      planName: sub.plan.title,
      startDate: sub.startDate,
      endDate: sub.endDate,
      duration: sub.plan.duration,
      
    })));

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener planes' });
  }
};

export const getMyRoutine = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId } = req.query; 

    // Buscamos suscripción activa. 
    // Si nos pasan planId, buscamos ESE plan. Si no, el primero que aparezca.
    const whereClause = {
      userId: parseInt(userId),
      isActive: true
    };
    
    if (planId) {
      whereClause.planId = parseInt(planId);
    }

    const subscription = await prisma.subscription.findFirst({
      where: whereClause,
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(404).json({ error: "No se encontró el plan solicitado." });
    }

    // ... (EL RESTO DEL CÓDIGO DE CÁLCULO DE SEMANAS SIGUE IGUAL) ...
    const selectedPlanId = subscription.planId; // Usamos el ID real encontrado

    const today = new Date();
    const startDate = new Date(subscription.startDate);
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    let currentUserWeek = Math.floor((diffDays - 1) / 7) + 1;
    if (currentUserWeek < 1) currentUserWeek = 1;

    const workouts = await prisma.workout.findMany({
      where: { planId: selectedPlanId },
      orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }]
    });

    const groupedWorkouts = workouts.reduce((acc, workout) => {
      const w = workout.weekNumber;
      if (!acc[w]) acc[w] = [];
      acc[w].push(workout);
      return acc;
    }, {});

    res.json({
      planId: selectedPlanId, // Devolvemos el ID para que el front sepa cuál cargó
      planName: subscription.plan.title,
      startDate: subscription.startDate,
      currentWeek: currentUserWeek,
      structure: groupedWorkouts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tu rutina' });
  }
};