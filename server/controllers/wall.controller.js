import prisma from '../db.js';

// Obtener mensajes de un muro (Plan)
export const getWallPosts = async (req, res) => {
  try {
    const { planId } = req.params;

    const posts = await prisma.wallPost.findMany({
      where: { planId: parseInt(planId) },
      include: {
        user: {
          select: { name: true, role: true } // Solo necesitamos nombre y rol
        }
      },
      orderBy: { createdAt: 'asc' }, // Los más nuevos arriba
      take: 50 // Limite de 50 para no sobrecargar
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cargando el muro" });
  }
};

// Publicar mensaje
export const createWallPost = async (req, res) => {
  try {
    const { planId, content, userId } = req.body;

    if (!content.trim()) return res.status(400).json({ error: "Mensaje vacío" });

    const newPost = await prisma.wallPost.create({
      data: {
        content,
        planId: parseInt(planId),
        userId: parseInt(userId)
      },
      include: {
        user: { select: { name: true } }
      }
    });

    res.json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error publicando mensaje" });
  }
};

export const approveAllWallPosts = async (req, res) => {
  try {
    await prisma.wallPost.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' }
    });
    res.json({ message: "Todos los posteos aprobados" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al aprobar posteos" });
  }
};