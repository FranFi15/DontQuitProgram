import prisma from '../db.js';

// Obtener límite actual Y contar los alumnos activos
export const getFollowUpLimit = async (req, res) => {
  try {
    // 1. Buscamos el límite que configuró Rocío (o 50 por defecto)
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'max_followup_slots' }
    });
    const maxSlots = setting ? parseInt(setting.value) : 50;

    // 2. CONTAMOS LOS ALUMNOS ACTIVOS (Aquí está la magia que faltaba)
    const usedSlots = await prisma.subscription.count({
      where: {
        isActive: true,
        plan: {
          hasFollowUp: true // Que el plan incluya chat
        },
        // Que la suscripción siga vigente (o no tenga fecha de fin por si se creó manual)
        OR: [
          { endDate: { gt: new Date() } },
          { endDate: null }
        ]
      }
    });

    // 3. Le mandamos al Frontend toda la info junta
    res.json({ 
      limit: maxSlots, 
      used: usedSlots,           // <--- Esto es lo que llena la barra verde
      isFull: usedSlots >= maxSlots 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
};

// Actualizar límite
export const updateFollowUpLimit = async (req, res) => {
  try {
    const { newLimit } = req.body; 
    
    // Verificamos que sea un número válido
    if (newLimit === undefined || newLimit < 0 || isNaN(newLimit)) {
        return res.status(400).json({ error: "Límite no válido" });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'max_followup_slots' },
      update: { value: newLimit.toString() },
      create: { key: 'max_followup_slots', value: newLimit.toString() }
    });

    res.json({ message: "Límite actualizado", limit: parseInt(setting.value) });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Error actualizando configuración" });
  }
};

export const getBankSettings = async (req, res) => {
  try {
    const keys = ['bank_alias', 'bank_cbu', 'bank_name'];
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    });

    // Convertimos el array de Prisma en un objeto fácil de leer para el Frontend
    const bankInfo = { alias: '', cbu: '', name: '' };
    settings.forEach(s => {
      if (s.key === 'bank_alias') bankInfo.alias = s.value;
      if (s.key === 'bank_cbu') bankInfo.cbu = s.value;
      if (s.key === 'bank_name') bankInfo.name = s.value;
    });

    res.json(bankInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos bancarios' });
  }
};

// Actualizar los datos bancarios (Solo Admin)
export const updateBankSettings = async (req, res) => {
  try {
    const { alias, cbu, name } = req.body;

    // Usamos upsert: si no existe la fila la crea, si existe la actualiza. ¡Magia pura!
    await prisma.systemSetting.upsert({
      where: { key: 'bank_alias' },
      update: { value: alias },
      create: { key: 'bank_alias', value: alias }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'bank_cbu' },
      update: { value: cbu },
      create: { key: 'bank_cbu', value: cbu }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'bank_name' },
      update: { value: name },
      create: { key: 'bank_name', value: name }
    });

    res.json({ message: 'Datos bancarios actualizados con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar datos bancarios' });
  }
};