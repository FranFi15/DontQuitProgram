import express from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import plansRoutes from './routes/plans.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import exercisesRoutes from './routes/exercises.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import chatRoutes from './routes/chat.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import recordsRoutes from './routes/records.routes.js';
import scoreboxRoutes from './routes/scorebox.routes.js';
import wallRoutes from './routes/wall.routes.js';
import planTypeRoutes from './routes/planType.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors({
  origin: ['http://localhost:5173', 'https://dont-quit-program.vercel.app','https://dontquitprogram.com'],
  credentials: true 
}));
app.use(express.json());

// --- Rutas ---
app.get('/', (req, res) => {
  res.send('API DontQuit funcionando 🚀');
});

// Usamos la ruta importada
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plan-types', planTypeRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/scoreboxes', scoreboxRoutes);
app.use('/api/wall', wallRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkout', checkoutRoutes); 

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});