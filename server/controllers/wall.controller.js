import prisma from '../db.js';

// Obtener mensajes de un muro (Plan)
export const getWallPosts = async (req, res) => {
  try {
    const { planId } = req.params;

    const posts = await prisma.wallPost.findMany({
      where: { planId: parseInt(planId) },
      include: {
        user: {
          select: { name: true, role: true } 
        }
      },
      orderBy: { createdAt: 'asc' }, 
      take: 50 
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

// 👇 NUEVA: Eliminar un mensaje del muro
export const deleteWallPost = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wallPost.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Mensaje eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el mensaje" });
  }
};

// 👇 NUEVA: Fijar/Desfijar un mensaje
export const togglePinWallPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscamos el post para saber su estado y a qué plan pertenece
    const post = await prisma.wallPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return res.status(404).json({ error: "Mensaje no encontrado" });

    const newPinStatus = !post.isPinned;

    // Si lo estamos fijando, primero desfijamos TODOS los demás de ese mismo plan
    if (newPinStatus === true) {
      await prisma.wallPost.updateMany({
        where: { planId: post.planId },
        data: { isPinned: false }
      });
    }

    // Ahora sí actualizamos el que tocamos
    const updatedPost = await prisma.wallPost.update({
      where: { id: parseInt(id) },
      data: { isPinned: newPinStatus }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al fijar el mensaje" });
  }
};

export const markWallAsSeen = async (req, res) => {
  try {
    const { userId } = req.body;
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { lastWallView: new Date() }
    });
    res.json({ message: "Visto actualizado" });
  } catch (error) {
    console.error("Error en markWallAsSeen:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

export const approvePostsByPlan = async (req, res) => {
  try {
    const { planId } = req.params; // 👈 Recibimos el ID del plan
    await prisma.wallPost.updateMany({
      where: { 
        planId: parseInt(planId),
        status: 'PENDING' 
      },
      data: { status: 'APPROVED' }
    });
    res.json({ message: "Mensajes de este plan aprobados" });
  } catch (error) {
    res.status(500).json({ error: "Error al aprobar mensajes del plan" });
  }
};

// 2. Necesitamos que Ro reciba la lista de planes con el conteo de pendientes
// Podés poner esto en tu controlador de planes o aquí mismo
export const getPlansWithStatus = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            wallPosts: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    });

    // Formateamos para que el front entienda fácil 'hasNew'
    const formatted = plans.map(p => ({
      id: p.id,
      title: p.title,
      hasNew: p._count.wallPosts > 0
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
};