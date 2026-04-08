import { Router } from 'express';
import { 
  getWallPosts, 
  createWallPost, 
  deleteWallPost, 
  togglePinWallPost, 
  markWallAsSeen,
  approvePostsByPlan , 
   getPlansWithStatus 
} from '../controllers/wall.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- RUTAS PARA EL CLIENTE (ALUMNO) ---
router.get('/:planId', verifyToken, getWallPosts);
router.post('/', verifyToken, createWallPost);
router.put('/seen', verifyToken, markWallAsSeen);

// --- RUTAS PARA EL ADMIN (RO) ---
// 1. Obtener la lista de planes con el contador de mensajes PENDING
router.get('/admin/plans-badges', verifyToken, isAdmin, getPlansWithStatus);

// 2. Marcar como APPROVED todos los mensajes de un plan específico
router.put('/approve-plan/:planId', verifyToken, isAdmin, approvePostsByPlan);

// 3. Gestión de mensajes (Eliminar y Fijar)
router.delete('/:id', verifyToken, isAdmin, deleteWallPost);
router.put('/:id/pin', verifyToken, isAdmin, togglePinWallPost);

export default router;