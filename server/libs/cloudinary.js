import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 1. CONFIGURAR CREDENCIALES
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. CONFIGURAR EL ALMACENAMIENTO
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'dontquit_chat', 
      resource_type: 'auto',   
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, 
    };
  },
});

// 3. EXPORTAR  MULTER
export const upload = multer({ storage });