// server/routes/records.routes.js
import { Router } from 'express';
import { createRecord, getUserRecords,updateRecord , deleteRecord } from '../controllers/record.controller.js';

const router = Router();

// POST /api/records -> Crear nuevo
router.post('/', createRecord);

// GET /api/records/:userId -> Obtener todos los de un usuario
router.get('/:userId', getUserRecords);

// PUT /api/records/:id -> Actualizar uno
router.put('/:id', updateRecord);

// DELETE /api/records/:id -> Borrar uno (por si se equivocó)
router.delete('/:id', deleteRecord);

export default router;