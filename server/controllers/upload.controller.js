export const uploadFile = (req, res) => {
  try {

    
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }


    res.json({
      url: req.file.path, 
      type: req.file.mimetype.startsWith('image') ? 'IMAGE' : 'VIDEO'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};