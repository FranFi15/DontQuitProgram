import prisma from '../db.js';

// Crear
export const createPlanType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newType = await prisma.planType.create({
      data: { name, description }
    });
    res.json(newType);
  } catch (error) {
    // Código P2002 de Prisma = Violación de campo único (Nombre repetido)
    if (error.code === 'P2002') {
        return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    }
    res.status(500).json({ error: "Error creando el tipo" });
  }
};

// Leer Todos
export const getPlanTypes = async (req, res) => {
  try {
    const types = await prisma.planType.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { plans: true }
          }
        }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo tipos" });
  }
};



// Actualizar
export const updatePlanType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const updatedType = await prisma.planType.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json(updatedType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error actualizando la categoría" });
    }
};

// Eliminar
export const deletePlanType = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.planType.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: "Categoría eliminada correctamente" });
    } catch (error) {
        // Código P2003 = Violación de Foreign Key (El tipo está siendo usado por un plan)
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                error: "No se puede eliminar esta categoría porque hay Planes asignados a ella. Primero cambia o borra esos planes." 
            });
        }
        console.error(error);
        res.status(500).json({ error: "Error eliminando la categoría" });
    }
};