import prisma from '../db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // --- NUEVO: 1. Obtener la fecha del primer día del mes actual ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // --- NUEVO: 2. Calcular los ingresos del mes (Pagos Aprobados) ---
    const revenueResult = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'APPROVED', 
        createdAt: {
          gte: startOfMonth, // Mayor o igual al día 1 de este mes
        },
      },
    });

    const monthlyRevenue = revenueResult._sum.amount || 0; // Si no hay pagos, devuelve 0
    // ----------------------------------------------------------------

    const activeSubsCount = await prisma.subscription.count({
      where: {
        isActive: true,
        endDate: { gt: today }
      }
    });

    const totalUsers = await prisma.user.count({
      where: { role: 'ATLETA', isActive: true }
    });

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

    const exercisesCount = await prisma.exerciseLibrary.count();

    // 3. Agregamos monthlyRevenue al JSON que mandamos al Frontend
    res.json({
      activeAthletes: activeSubsCount,
      totalUsers,
      exercisesCount,
      expiringSoon,
      monthlyRevenue 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};