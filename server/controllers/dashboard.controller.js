import prisma from '../db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // 1. Obtener la fecha del primer día del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // --- CAMBIO CLAVE: Traer pagos del mes para separar por moneda ---
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        createdAt: { gte: startOfMonth },
      },
      select: {
        amount: true,
        currency: true
      }
    });

    // Calculamos totales por separado
    const monthlyRevenueARS = monthlyPayments
      .filter(p => p.currency === 'ARS' || !p.currency) // Por si alguno quedó null, asumimos ARS
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenueUSD = monthlyPayments
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    // --- NUEVO: 2. Contar pagos PENDIENTES para los Badges ---
    const pendingPaymentsCount = await prisma.payment.count({
      where: { status: 'PENDING' }
    });

    // 3. Suscripciones activas
    const activeSubsCount = await prisma.subscription.count({
      where: {
        isActive: true,
        endDate: { gt: today }
      }
    });

    // 4. Alumnos registrados (Filtrando por tu rol 'ATLETA')
    const totalUsers = await prisma.user.count({
      where: { role: 'ATLETA', isActive: true }
    });

    // 5. Próximos vencimientos
    const expiringSoon = await prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: {
          gt: today,   
          lte: nextWeek 
        }
      },
      include: {
        user: { select: { name: true, phone: true } },
        plan: { select: { title: true } }
      },
      orderBy: { endDate: 'asc' }
    });

    // 6. Contador de ejercicios
    const exercisesCount = await prisma.exerciseLibrary.count();

    // Enviamos el JSON completo para que React no rompa
    res.json({
      activeAthletes: activeSubsCount,
      totalUsers,
      exercisesCount,
      expiringSoon,
      monthlyRevenueARS, // 👈 Nuevo
      monthlyRevenueUSD, // 👈 Nuevo
      pendingPayments: pendingPaymentsCount // 👈 Nuevo para los Badges
    });

  } catch (error) {
    console.error("❌ Error en Dashboard Stats:", error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};