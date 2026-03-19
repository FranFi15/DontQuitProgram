import prisma from '../db.js';

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, mediaUrl, mediaType } = req.body;

    // 👇 1. ESCUDO ANTI-NAN: Verificamos que los IDs sean números reales
    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);

    if (isNaN(sId) || isNaN(rId)) {
      return res.status(400).json({ error: "IDs de usuario inválidos o no cargados." });
    }

    // --- NIVEL 1: VALIDAR REMITENTE ---
    const sender = await prisma.user.findUnique({
      where: { id: sId }
    });

    if (!sender) {
      return res.status(404).json({ error: "Usuario remitente no encontrado" });
    }

    // SI NO ES ADMIN, APLICAMOS RESTRICCIONES
    if (sender.role !== 'ADMIN') {

      // --- NIVEL 2: VALIDAR PERMISO DE SEGUIMIENTO (PLAN) ---
      const hasFollowUpAccess = await prisma.subscription.findFirst({
        where: {
          userId: sId,
          isActive: true, 
          // 👇 BUG CORREGIDO: Borramos el "endDate: { gt: new Date() }" de acá arriba 
          // porque chocaba con la regla de abajo e impedía los planes "De por Vida"
          plan: {
            hasFollowUp: true 
          },
          OR: [
            { endDate: { gt: new Date() } },
            { endDate: null } // Permite planes de por vida
          ]
        }
      });

      if (!hasFollowUpAccess) {
        return res.status(403).json({ 
          error: "Tu plan actual no incluye seguimiento por chat o tu suscripción ha vencido." 
        });
      }

      // --- NIVEL 3: LÍMITE DE ARCHIVOS MULTIMEDIA ---
      if (mediaType === 'VIDEO' || mediaType === 'IMAGE') {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7); 

        const mediaCount = await prisma.message.count({
          where: {
            senderId: sId,
            mediaType: { in: ['VIDEO', 'IMAGE'] }, 
            createdAt: {
              gte: dateLimit 
            }
          }
        });

        if (mediaCount >= 3) {
          return res.status(403).json({ 
            error: "Límite semanal alcanzado (3 archivos). Podrás enviar más cuando pasen 7 días desde tu último envío." 
          });
        }
      }
    }
    // ---------------------------------------------------------

    // --- 4. SI PASÓ TODAS LAS BARRERAS, CREAMOS EL MENSAJE ---
    const newMessage = await prisma.message.create({
      data: {
        senderId: sId,
        receiverId: rId,
        content,
        mediaUrl,
        mediaType,
        isRead: false
      }
    });

    res.json(newMessage);

  } catch (error) {
    console.error("🚨 Error en sendMessage:", error);
    res.status(500).json({ error: 'Error interno al enviar el mensaje' });
  }
};


export const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // 👇 ESCUDO ANTI-NAN PARA LEER EL CHAT
    const u1 = parseInt(userId1);
    const u2 = parseInt(userId2);

    if (isNaN(u1) || isNaN(u2)) {
      return res.json([]); // Si llega basura, le devolvemos un chat vacío para que no explote
    }

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
            ],
            plan: {
              hasFollowUp: true 
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        sentMessages: {
          where: {
            receiverId: 1,
            isRead: false
          },
          take: 1 
        }
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      hasUnread: user.sentMessages.length > 0 
    }));

    formattedUsers.sort((a, b) => (b.hasUnread === a.hasUnread ? 0 : b.hasUnread ? 1 : -1));

    res.json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios del chat' });
  }
};