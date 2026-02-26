import prisma from '../db.js';

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, mediaUrl, mediaType } = req.body;

    // --- NIVEL 1: VALIDAR REMITENTE ---
    const sender = await prisma.user.findUnique({
      where: { id: parseInt(senderId) }
    });

    if (!sender) {
      return res.status(404).json({ error: "Usuario remitente no encontrado" });
    }

    // SI NO ES ADMIN, APLICAMOS RESTRICCIONES
    if (sender.role !== 'ADMIN') {

      // --- NIVEL 2: VALIDAR PERMISO DE SEGUIMIENTO (PLAN) ---
      // Buscamos si tiene ALGUNA suscripción activa que incluya chat
      const hasFollowUpAccess = await prisma.subscription.findFirst({
        where: {
          userId: parseInt(senderId),
          isActive: true, // Que no esté cancelada
          endDate: { gt: new Date() }, 
          plan: {
            hasFollowUp: true 
          },
          OR: [
            { endDate: { gt: new Date() } },
            { endDate: null }
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
        
        // Calculamos la fecha de hace 7 días exactos
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7); 

        // Contamos cuántos archivos envió en la última semana
        const mediaCount = await prisma.message.count({
          where: {
            senderId: parseInt(senderId),
            mediaType: { in: ['VIDEO', 'IMAGE'] }, 
            createdAt: {
              gte: dateLimit // Mayor o igual a hace 7 días
            }
          }
        });

        // Límite: 3 archivos por semana
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
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content,
        mediaUrl,
        mediaType,
        isRead: false
      }
    });

    res.json(newMessage);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

// ... (El resto del archivo getConversation y markAsRead queda IGUAL) ...
export const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: parseInt(userId1), receiverId: parseInt(userId2) },
          { senderId: parseInt(userId2), receiverId: parseInt(userId1) }
        ]
      },
      orderBy: { createdAt: 'asc' }, 
      include: {
        sender: { select: { name: true, role: true } } 
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener chat' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    await prisma.message.updateMany({
      where: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
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

    // 1. Buscamos solo usuarios que tengan un plan activo con "hasFollowUp: true"
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
              hasFollowUp: true // LA CLAVE: Solo planes con seguimiento
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        // 2. Le pedimos a Prisma que nos traiga si tienen mensajes no leídos enviados al Admin (ID 1)
        sentMessages: {
          where: {
            receiverId: 1,
            isRead: false
          },
          take: 1 // Con saber que hay 1 nos basta para prender la alerta
        }
      }
    });

    // 3. Formateamos la respuesta para que el frontend la entienda fácil
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      hasUnread: user.sentMessages.length > 0 // true si hay mensajes sin leer
    }));

    // Opcional: Ordenamos para que los que tienen mensajes sin leer aparezcan arriba
    formattedUsers.sort((a, b) => (b.hasUnread === a.hasUnread ? 0 : b.hasUnread ? 1 : -1));

    res.json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios del chat' });
  }
};