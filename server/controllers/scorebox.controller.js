import prisma from '../db.js';

// --- ADMIN: CREAR UN SCOREBOX EN UN PLAN ---
export const createScoreBox = async (req, res) => {
  try {
    const { planId, name, measureUnit } = req.body;
    const newBox = await prisma.scoreBox.create({
      data: {
        planId: parseInt(planId),
        name,
        measureUnit
      }
    });
    res.json(newBox);
  } catch (error) {
    res.status(500).json({ error: "Error creando ScoreBox" });
  }
};

export const updateScoreBox = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, measureUnit } = req.body;

    const updated = await prisma.scoreBox.update({
      where: { id: parseInt(id) },
      data: { name, measureUnit }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando ScoreBox" });
  }
};

// --- ADMIN: BORRAR SCOREBOX ---
export const deleteScoreBox = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.scoreBox.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando" });
  }
};

// --- CLIENTE/ADMIN: VER SCOREBOXES DE UN PLAN (Y SUS RESULTADOS SI ES CLIENTE) ---
export const getPlanScoreBoxes = async (req, res) => {
  try {
    const { planId } = req.params;
    const { userId } = req.query; // Opcional: si pasamos userId, traemos sus últimos resultados

    const boxes = await prisma.scoreBox.findMany({
      where: { planId: parseInt(planId) },
      include: {
        // Si hay userId, traemos el último resultado de ese usuario para esta caja
        entries: userId ? {
          where: { userId: parseInt(userId) },
          orderBy: { date: 'desc' },
          take: 1
        } : false
      }
    });

    res.json(boxes);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo ScoreBoxes" });
  }
};

// --- CLIENTE: SUBIR UN RESULTADO ---
export const addScoreEntry = async (req, res) => {
  try {
    const { userId, scoreBoxId, value } = req.body;
    const entry = await prisma.scoreEntry.create({
      data: {
        userId: parseInt(userId),
        scoreBoxId: parseInt(scoreBoxId),
        value
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Error guardando resultado" });
  }
};

export const updateScoreEntry = async (req, res) => {
  try {
    const { id } = req.params; // El ID de la entrada (ScoreEntry)
    const { userId, value } = req.body;

    // 1. Buscar la entrada original
    const entry = await prisma.scoreEntry.findUnique({
      where: { id: parseInt(id) }
    });

    if (!entry) {
      return res.status(404).json({ error: "Entrada no encontrada" });
    }

    // 2. Seguridad: Verificar que la entrada pertenezca al usuario que la quiere editar
    if (entry.userId !== parseInt(userId)) {
      return res.status(403).json({ error: "No tienes permiso para editar este registro." });
    }

    // 3. Actualizar el valor
    const updatedEntry = await prisma.scoreEntry.update({
      where: { id: parseInt(id) },
      data: { value }
    });

    res.json(updatedEntry);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar resultado" });
  }
};

export const getUserPlanHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscamos TODAS las suscripciones del usuario (sin filtrar isActive)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: parseInt(userId)
      },
      distinct: ['planId'], // IMPORTANTE: Si se suscribió 3 veces al mismo plan, solo traerlo una vez
      select: {
        plan: {
          select: { id: true, title: true }
        }
      }
    });

    // Formateamos para el frontend
    const history = subscriptions.map(sub => ({
      planId: sub.plan.id,
      planName: sub.plan.title
    }));

    res.json(history);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
};