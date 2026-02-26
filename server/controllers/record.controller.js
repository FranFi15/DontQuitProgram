// server/controllers/record.controller.js
import prisma from '../db.js';

// --- HELPER: FÓRMULA DE BRZYCKI ---
// 1RM = Peso / (1.0278 - (0.0278 * Reps))
const calculate1RM = (weight, reps) => {
  if (reps === 1) return weight;
  
  // Evitamos números negativos o división por cero si alguien pone 37 reps (el límite de la fórmula)
  const denominator = 1.0278 - (0.0278 * reps);
  
  if (denominator <= 0) return weight; // Fallback por seguridad

  return Math.round(weight / denominator);
};

// 1. CREAR UN NUEVO RÉCORD
export const createRecord = async (req, res) => {
  try {
    const { userId, exercise, weight, reps } = req.body;

    // Validamos datos básicos
    if (!userId || !exercise || !weight || !reps) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Calculamos el 1RM antes de guardar
    const calculatedRM = calculate1RM(parseFloat(weight), parseInt(reps));

    const newRecord = await prisma.personalRecord.create({
      data: {
        userId: parseInt(userId),
        exercise: exercise,        // Guardamos el texto tal cual lo escribió el usuario
        weight: parseFloat(weight),
        reps: parseInt(reps),
        oneRM: calculatedRM        // Guardamos el resultado del cálculo
      }
    });

    res.json(newRecord);
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Error al guardar el récord" });
  }
};

// 2. OBTENER EL HISTORIAL DE UN USUARIO
export const getUserRecords = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const records = await prisma.personalRecord.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'desc' } // Los más recientes primero
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Error al obtener los récords" });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { exercise, weight, reps } = req.body;

    // Recalculamos el 1RM con los nuevos datos
    const calculatedRM = calculate1RM(parseFloat(weight), parseInt(reps));

    const updatedRecord = await prisma.personalRecord.update({
      where: { id: parseInt(id) },
      data: {
        exercise,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        oneRM: calculatedRM
      }
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar" });
  }
};

// 3. (OPCIONAL) ELIMINAR UN RÉCORD
export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.personalRecord.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Récord eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
};