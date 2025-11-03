import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
  host: '127.0.0.1',
  port: 3308, // asegúrate del puerto
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Conexión directa establecida correctamente.');
    const rows = await conn.query('SELECT DATABASE() AS db');
    console.log('Base de datos actual:', rows[0].db);
  } catch (err) {
    console.error('❌ Error de conexión directa:', err);
  } finally {
    if (conn) conn.release();
    pool.end();
  }
}

testConnection();
