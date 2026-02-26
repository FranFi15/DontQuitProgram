import prisma from '../db.js';


export const getAllExercises = async (req, res) => {
  try {
    const exercises = await prisma.exerciseLibrary.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
};

export const createExercise = async (req, res) => {
  try {
    const { name, description, videoUrl } = req.body;
    if (!name) return res.status(400).json({ error: "El nombre es obligatorio" });

    const newExercise = await prisma.exerciseLibrary.create({
      data: {
        name,
        description,
        videoUrl: videoUrl || "", 
      }
    });
    
    res.json(newExercise);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un ejercicio con ese nombre' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear ejercicio' });
  }
};


export const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, videoUrl } = req.body;

    const updated = await prisma.exerciseLibrary.update({
      where: { id: parseInt(id) },
      data: { name, description, videoUrl }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ejercicio' });
  }
};


export const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.exerciseLibrary.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Ejercicio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};