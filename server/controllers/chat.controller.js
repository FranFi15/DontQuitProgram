import prisma from '../db.js';

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, mediaUrl, mediaType } = req.body;

    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);

    if (isNaN(sId) || isNaN(rId)) {
      return res.status(400).json({ error: "IDs inválidos." });
    }

    // --- 1. VALIDAR REMITENTE ---
    const sender = await prisma.user.findUnique({ where: { id: sId } });
    if (!sender) return res.status(404).json({ error: "Usuario no encontrado" });

    if (sender.role !== 'ADMIN') {
      // --- 2. VALIDAR PLAN (A PRUEBA DE FALLOS) ---
      // Traemos el plan entero en vez de filtrar adentro de Prisma para evitar errores si la BD está desactualizada
      const userSub = await prisma.subscription.findFirst({
        where: {
          userId: sId,
          isActive: true,
          OR: [
            { endDate: { gt: new Date() } },
            { endDate: null } 
          ]
        },
        include: { plan: true } // Traemos la data del plan a JavaScript
      });

      // Validamos en JavaScript
      if (!userSub || userSub.plan?.hasFollowUp !== true) {
        return res.status(403).json({ error: "Tu plan no incluye chat." });
      }

      // --- 3. LÍMITE MULTIMEDIA ---
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
          return res.status(403).json({ error: "Límite semanal alcanzado." });
        }
      }
    }

    // --- 4. PREVENCIÓN DE ERROR DE TIPO ---
    // Si envían 'TEXT', lo convertimos a null para que Prisma no explote esperando una imagen/video
    const safeMediaType = mediaType === 'TEXT' ? null : mediaType;

    const newMessage = await prisma.message.create({
      data: {
        senderId: sId,
        receiverId: rId,
        content: content || "",
        mediaUrl: mediaUrl || null,
        mediaType: safeMediaType,
        isRead: false
      }
    });

    res.json(newMessage);

  } catch (error) {
    console.error("🚨 Error crítico en sendMessage:", error);
    // 👇 Esto nos va a devolver exactamente qué le molestó a Prisma
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};


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
      include: {
        sender: { select: { name: true, role: true } } 
      }
    });

    res.json(messages);
  } catch (error) {
    console.error("🚨 Error en getConversation:", error);
    res.status(500).json({ error: 'Error al obtener chat' });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);

    if (isNaN(sId) || isNaN(rId)) return res.json({ message: "IDs inválidos" });

    await prisma.message.updateMany({
      where: {
        senderId: sId,
        receiverId: rId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Mensajes leídos' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};


export const getChatUsers = async (req, res) => {
  try {
    const today = new Date();

    const users = await prisma.user.findMany({
      where: {
        role: 'ATLETA',
        subscriptions: {
          some: {
            isActive: true,
            OR: [
              { endDate: { gt: today } },
              { endDate: null }
            ]
          }
        }
      },
      // Hacemos un include para traernos todo y filtrarlo más seguro en JS
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { plan: true }
        },
        sentMessages: {
          where: { receiverId: 1, isRead: false },
          take: 1 
        }
      }
    });

    // Filtramos en JS para no romper Prisma
    const formattedUsers = users
      .filter(u => u.subscriptions.some(sub => sub.plan?.hasFollowUp === true))
      .map(user => ({
        id: user.id,
        name: user.name,
        hasUnread: user.sentMessages.length > 0 
      }));

    formattedUsers.sort((a, b) => (b.hasUnread === a.hasUnread ? 0 : b.hasUnread ? 1 : -1));

    res.json(formattedUsers);
  } catch (error) {
    console.error("🚨 Error en getChatUsers:", error);
    res.status(500).json({ error: 'Error al obtener usuarios del chat' });
  }
};