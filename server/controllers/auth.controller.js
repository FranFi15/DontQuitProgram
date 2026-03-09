import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { sendPasswordResetLinkEmail } from '../utils/mailer.js';

const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

// 1. REGISTRO 
export const register = async (req, res) => {
  try {
    const { email, password, name, role, sex, phone, birthDate } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'ATLETA',
        sex: sex,
        phone: phone || null,
        birthDate: birthDate ? new Date(birthDate + "T12:00:00Z") : null, 
      },
    });

    res.json({ message: 'Usuario creado con éxito', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// 2. LOGIN 
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      // ¡AQUÍ ESTÁ LA CLAVE! Traemos la suscripción activa y su plan
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { endDate: 'desc' },
          take: 1, // Solo la más reciente
          include: {
            plan: { select: { title: true, hasFollowUp: true } } // Pedimos el hasFollowUp
          }
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: '7d',
    });

    const { password: _, ...userData } = user;
    
    // Simplificamos la estructura para el frontend
    const activeSub = userData.subscriptions[0] || null;
    userData.subscription = activeSub; 
    delete userData.subscriptions;

    res.json({ token, user: userData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// 3. VERIFY TOKEN 
export const verifyToken = async (req, res) => {
  const token = req.headers['authorization']; 

  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, SECRET_KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      // ¡IGUAL QUE EN LOGIN!
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: {
            plan: { select: { title: true, hasFollowUp: true } }
          }
        }
      }
    });

    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const activeSub = user.subscriptions[0] || null;

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sex: user.sex,            
      phone: user.phone,       
      birthDate: user.birthDate, 
      subscription: activeSub // Pasamos la suscripción armada
    });
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// 1. Genera el link y lo envía
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "El email es obligatorio" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "No existe una cuenta con este correo." });

    // Creamos un token que expira en 15 minutos. Usamos la misma firma secreta de tu login.
   const resetToken = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '15m' });

    // URL de tu frontend (Ajustar si usas localhost para probar)
    const frontendUrl = process.env.FRONTEND_URL || 'https://dontquitprogram.com';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetLinkEmail(user.email, user.name, resetLink);

    res.status(200).json({ message: "Te enviamos un enlace de recuperación al correo." });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 2. Recibe la nueva contraseña y el token, y la cambia
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Faltan datos." });
    if (newPassword.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });

    // Verificamos si el token es válido y no expiró
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(400).json({ error: "El enlace es inválido o ha expirado. Volvé a solicitar uno nuevo." });
    }

    // Hasheamos la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizamos al usuario
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: "¡Contraseña actualizada correctamente!" });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};