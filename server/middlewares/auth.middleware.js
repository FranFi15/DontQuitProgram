import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

export const verifyToken = (req, res, next) => {
  // 1. Obtener el header Authorization
  const authHeader = req.headers['authorization'];
  
  // El formato suele ser "Bearer <token>", así que tomamos la segunda parte
  // Si envías solo el token sin "Bearer", usa: const token = authHeader;
  const token = authHeader && authHeader.startsWith('Bearer ') 
                ? authHeader.split(' ')[1] 
                : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. No hay token." });
  }

  try {
    // 2. Verificar el token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // 3. Guardar los datos del usuario en la request (req.user)
    req.user = decoded; // { id: 1, role: 'ATLETA', ... }
    
    // 4. Continuar a la siguiente función (el controlador)
    next(); 
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};

// 👇 NUEVO MIDDLEWARE: ESCUDO PARA ADMIN
export const isAdmin = (req, res, next) => {
  // Como lo vamos a poner siempre DESPUÉS de verifyToken, 
  // req.user ya va a estar cargado con los datos.
  
  if (!req.user) {
    return res.status(401).json({ error: "Acceso denegado. No estás autenticado." });
  }

  // Comparamos el rol exacto
  if (req.user.role !== 'ADMIN') {
    console.warn(`🚨 Alerta de seguridad: El usuario ID ${req.user.id} intentó acceder a una zona de Admin.`);
    return res.status(403).json({ error: "Acceso denegado. Esta acción es exclusiva para la Coach." });
  }

  // Si es Ro (ADMIN), le abrimos la puerta al controlador
  next();
};