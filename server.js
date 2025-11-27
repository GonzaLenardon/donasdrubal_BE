import express from 'express';
import dotenv from 'dotenv';
import { db } from './src/models/index.js';

import { router } from './src/routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Authorization, Content-Type, X-Requested-With',
    credentials: true,
  })
);

app.use('/', router);

const PORT = process.env.SERVER_PORT || 3000;

const startServer = async () => {
  try {
    // 🔹 Primero probar conexión
    await db.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // 🔹 Luego sincronizar modelos (sin borrar datos)
    // await db.sync({ force: false });
    await db.sync({ alter: false }); // Ajusta tablas sin borrar datos
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
