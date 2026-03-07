// server/controllers/userController.js
import prisma from '../db.js';
import bcrypt from 'bcryptjs';

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ATLETA' }, 
      orderBy: { name: 'asc' },  
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        sex: true,
        birthDate: true,
        isActive: true,
        

        subscriptions: {
          where: { isActive: true }, 
          orderBy: { endDate: 'desc' }, 
          take: 1, 
          select: { endDate: true, plan: { select: { title: true } } }
        }
      }
    });

    const usersWithStatus = users.map(user => {
      const lastSub = user.subscriptions[0];
      
      const hasValidSubscription = lastSub && new Date(lastSub.endDate) > new Date();

      return {
        ...user,
        age: calculateAge(user.birthDate),
        subscriptionStatus: hasValidSubscription ? 'ACTIVO' : 'INACTIVO',
        planName: hasValidSubscription ? lastSub.plan.title : 'Sin Plan'
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, birthDate, sex } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'ATLETA',
        phone,
        sex,
        birthDate: birthDate ? new Date(birthDate + "T12:00:00Z") : null,
      },
    });

    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, phone, birthDate, sex } = req.body;

    let updateData = { 
      name, 
      email, 
      role,
      phone,
      sex,
      birthDate: birthDate ? new Date(birthDate + "T12:00:00Z") : null,
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Utilizamos una Transacción para asegurar que todo se borre o no se borre nada
    await prisma.$transaction([
      
      // 1. Finanzas y Accesos
      prisma.payment.deleteMany({ where: { userId: userId } }),
      prisma.subscription.deleteMany({ where: { userId: userId } }),
      
      // 2. Historial de Entrenamientos y RMs
      prisma.personalRecord.deleteMany({ where: { userId: userId } }),
      prisma.workoutResult.deleteMany({ where: { userId: userId } }),
      prisma.scoreEntry.deleteMany({ where: { userId: userId } }),
      
      // 3. Interacción Social (Muro)
      prisma.wallPost.deleteMany({ where: { userId: userId } }),

      // 4. Chat (Mensajes enviados o recibidos por el usuario)
      prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),

      // 5. Finalmente, aniquilamos al usuario
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    res.json({ message: 'Usuario y todo su historial han sido eliminados permanentemente' });
  } catch (error) {
    console.error("Error al hacer hard-delete del usuario:", error);
    res.status(500).json({ error: 'Error interno al limpiar las dependencias del usuario' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario
    const { name, phone, sex, birthDate } = req.body;

    // Validación básica
    if (parseInt(id) !== req.user.id) {
       return res.status(403).json({ error: "No puedes editar otro perfil" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        sex,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    // Devolvemos el usuario limpio (sin password)
    const { password: _, ...userData } = updatedUser;
    res.json(userData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando perfil" });
  }
  console.log("Recibida petición de actualización");
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 1. Verificar usuario
    if (parseInt(id) !== req.user.id) return res.status(403).json({ error: "No autorizado" });

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // 2. Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }

    // 3. Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Guardar
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: "Contraseña actualizada con éxito" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: parseInt(id) },
      include: { 
        plan: { select: { title: true, duration: true } } 
      },
      orderBy: { startDate: 'desc' } 
    });

    res.json(subscriptions);
  } catch (error) {
    console.error("Error obteniendo suscripciones del usuario:", error);
    res.status(500).json({ error: 'Error al obtener historial de suscripciones' });
  }
};