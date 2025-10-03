import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs-extra';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import trainingRoutes from './routes/training.js';
import evaluationRoutes from './routes/evaluation.js';
import modelVersioningRoutes from './routes/modelVersioning.js';
import feedbackRoutes from './routes/feedback.js';
import activeLearningRoutes from './routes/activeLearning.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/model-versioning', modelVersioningRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/active-learning', activeLearningRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start server after DB connects
connectDB()
  .then(async () => {
    // Create uploads directory
    await fs.ensureDir('uploads');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads directory created`);
      console.log(`🤖 HuggingFace integration ready`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
