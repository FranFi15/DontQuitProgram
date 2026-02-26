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