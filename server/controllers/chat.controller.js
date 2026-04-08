import prisma from '../db.js';

// --- ENVIAR MENSAJE ---
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, mediaUrl, mediaType } = req.body;
    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);

    if (isNaN(sId) || isNaN(rId)) return res.status(400).json({ error: "IDs inválidos." });

    const sender = await prisma.user.findUnique({ where: { id: sId } });
    if (!sender) return res.status(404).json({ error: "Usuario no encontrado" });

    // Validaciones para ATLETAS (Ro es ADMIN y no tiene límites)
    if (sender.role !== 'ADMIN') {
      const userSub = await prisma.subscription.findFirst({
        where: {
          userId: sId,
          isActive: true,
          OR: [{ endDate: { gt: new Date() } }, { endDate: null }]
        },
        include: { plan: true }
      });

      if (!userSub || userSub.plan?.hasFollowUp !== true) {
        return res.status(403).json({ error: "Tu plan no incluye chat." });
      }

      if (mediaType === 'VIDEO' || mediaType === 'IMAGE') {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7); 

        const mediaCount = await prisma.message.count({
          where: {
            senderId: sId,
            mediaType: { in: ['VIDEO', 'IMAGE'] }, 
            createdAt: { gte: dateLimit }
          }
        });

        if (mediaCount >= 3) {
          return res.status(403).json({ error: "Límite semanal alcanzado (3)." });
        }
      }
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: sId,
        receiverId: rId,
        content: content || "",
        mediaUrl: mediaUrl || null,
        mediaType: mediaType === 'TEXT' ? null : mediaType,
        isRead: false
      }
    });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};

// --- OBTENER CONVERSACIÓN ---
export const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const u1 = parseInt(userId1);
    const u2 = parseInt(userId2);

    if (isNaN(u1) || isNaN(u2)) return res.json([]); 

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: u1, receiverId: u2 },
          { senderId: u2, receiverId: u1 }
        ]
      },
      orderBy: { createdAt: 'asc' }, 
      include: { sender: { select: { name: true, role: true } } }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener chat' });
  }
};

// --- MARCAR COMO LEÍDO ---
export const markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);

    await prisma.message.updateMany({
      where: { senderId: sId, receiverId: rId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'Leído' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// --- LISTA DE USUARIOS PARA RO (ADMIN) ---
export const getChatUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'ATLETA',
        subscriptions: {
          some: {
            isActive: true,
            OR: [{ endDate: { gt: new Date() } }, { endDate: null }]
          }
        }
      },
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { plan: true }
        },
        // 👇 Contamos cuántos mensajes mandó este usuario a Ro (41) que están sin leer
        sentMessages: {
          where: { 
            receiverId: 41, 
            isRead: false 
          }
        }
      }
    });

    const formattedUsers = users
      .filter(u => u.subscriptions.some(sub => sub.plan?.hasFollowUp === true))
      .map(user => ({
        id: user.id,
        name: user.name,
        // Mandamos el conteo real para el frontend
        unreadCount: user.sentMessages.length 
      }));

    // Ordenamos: Los que tienen mensajes sin leer (unreadCount > 0) van arriba
    formattedUsers.sort((a, b) => b.unreadCount - a.unreadCount);

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// --- BADGES PARA EL CLIENTE (ALUMNO) ---
export const getClientBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const uId = parseInt(userId);
    if (isNaN(uId)) return res.status(400).json({ error: "ID inválido" });

    const unreadChat = await prisma.message.count({
      where: { receiverId: uId, isRead: false }
    });

    const user = await prisma.user.findUnique({
      where: { id: uId },
      include: {
        subscriptions: { where: { isActive: true }, select: { planId: true } }
      }
    });

    let unreadWall = 0;
    const activePlanId = user?.subscriptions[0]?.planId;

    if (activePlanId) {
      // Usamos el GT que arreglamos para evitar que el punto rojo vuelva
      const referenceDate = user.lastWallView || new Date(0); 
      unreadWall = await prisma.wallPost.count({
        where: {
          planId: activePlanId,
          userId: { not: uId },
          createdAt: { gt: referenceDate } 
        }
      });
    }

    res.json({ unreadChat, unreadWall });
  } catch (error) {
    res.status(500).json({ error: "Error badges" });
  }
};