import express from 'express';
import dotenv from 'dotenv';
import { db } from './src/models/index.js';

import { router } from './src/routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log('🌐', req.method, req.originalUrl);
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    /*  origin: process.env.URL, */
    // origin: 'http://localhost:5173',
    origin: true,
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type',
    credentials: true,
  })
);
// app.options(/.*/, cors());


app.use('/', router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(process.cwd(), 'uploads');

app.use('/uploads', express.static(uploadsPath));

const PORT = process.env.SERVER_PORT || 3000;

const startServer = async () => {
  try {
    // 🔹 Primero probar conexión
    await db.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // 🔹 Luego sincronizar modelos (sin borrar datos)
    // await db.sync({ force: false });
    await db.sync({ alter: true }); // Ajusta tablas sin borrar datos
    console.log('📦 Base de datos sincronizada.');

    // 🔹 Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      '❌ Error al conectar o sincronizar la base de datos:',
      error
    );
  }
};

startServer();
