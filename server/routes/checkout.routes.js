import express from 'express';
import { processCheckout } from '../controllers/checkoutController.js';

// Suponiendo que ya tenés configurado un middleware de upload (Multer o Cloudinary)
import { upload } from '../libs/cloudinary.js'; 

const router = express.Router();

// Ruta unificada para recibir el checkout completo
// usamos upload.single('receipt') para atajar la foto
router.post('/register-checkout', upload.single('receipt'), processCheckout);

export default router;