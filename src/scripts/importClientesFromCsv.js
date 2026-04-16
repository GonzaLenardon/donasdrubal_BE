import fs from 'fs';
import path from 'path';
import db from '../config/database.js';
import Clientes from '../models/clientes.js';
import Users from '../models/users.js';
import ClienteIngenieros from '../models/clientesIngenieros.js';
import Maquinas from '../models/maquinas.js';
import Calibraciones from '../models/calibraciones.js';
import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';
import Jornada from '../models/jornada.js';
import Roles from '../models/roles.js';
import UserRoles from '../models/user_roles.js';
import { Op } from 'sequelize';

const CSV_PATH = path.resolve('src', 'assets', 'clientes_import.csv');
const TIPO_CLIENTE_MAP = {
  A: 1,
  B: 2,
  C: 3,
};

const normalizeEmailName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const parseCsvLine = (line) => line.split(';').map((cell) => cell.trim());

const parseBooleanSi = (value) => /^s(?:i)?$/i.test(String(value).trim());

const parseInteger = (value) => {
  const number = parseInt(String(value || '').trim(), 10);
  return Number.isNaN(number) ? null : number;
};

const parseFloatValue = (value) => {
  const number = parseFloat(String(value || '').trim().replace(',', '.'));
  return Number.isNaN(number) ? null : number;
};

const importClients = async () => {
  try {
    await db.authenticate();
    console.log('✅ Conectado a la base de datos');

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      console.log('⚠️ El archivo CSV está vacío');
      return;
    }

    const rows = lines; // El archivo ya no tiene cabecera
    let importedCount = 0;
    let skippedCount = 0;

    const roles = await Roles.findOne({
        where: { nombre: { [Op.like]: '%Cliente%' } },
    });
    const role_id = roles ? roles.id : 4; // ID del rol "Cliente" (ajustar según tu base de datos)

    for (const [rowIndex, line] of rows.entries()) {
      const columns = parseCsvLine(line);
      const razon_social = columns[0] || '';

      if (!razon_social) {
        console.log(`🔶 Fila ${rowIndex + 1}: sin razón social, se salta`);
        skippedCount += 1;
        continue;
      }

      const tipo_cliente_id = TIPO_CLIENTE_MAP[String(columns[1] || '').toUpperCase()] || null;
      const maquinasCount = parseInteger(columns[2]) || 0;
      const pozosCount = parseInteger(columns[3]) || 0;
      const jornadasCount = parseInteger(columns[4]) || 0;
      const ingenierosRaw = [columns[5], columns[6], columns[7]];
      const litros_estimados = parseFloatValue(columns[8]);
      const comodato = parseBooleanSi(columns[9]);

      const ingenieros = ingenierosRaw
        .map((value, index) => {
          const user_id = parseInteger(value);
          if (!user_id) return null;
          return {
            user_id,
            es_principal: index === 0,
          };
        })
        .filter(Boolean);

      const email = `importado_${rowIndex + 1}_${normalizeEmailName(razon_social)}@donasdrubal.local`;
      const defaultIvaId = 1;

      await db.transaction(async (transaction) => {
        const existingClient = await Clientes.findOne({
          where: { razon_social },
          transaction,
        });

        if (existingClient) {
          console.log(`⚠️ Fila ${rowIndex + 2}: cliente existente "${razon_social}" -> se omite`);
          skippedCount += 1;
          return;
        }

        const cliente = await Clientes.create(
          {
            razon_social,
            tipo_cliente_id,
            litros_estimados,
            comodato,
            email,
            iva_id: defaultIvaId,
          },
          { transaction },
        );

        // ✅ Crear usuario asociado al cliente
        const usuarioCliente = await Users.create(
          {
            nombre: razon_social,
            email: email,
            password: '123456', // Contraseña estándar
            telefono: '0', // Teléfono por defecto
          },
          { transaction },
        );

        // Crear relación user_roles
          await UserRoles.create(
            {
              user_id: usuarioCliente.id, //new user_id
              role_id: role_id,
            },
            { transaction },
          );        

        // Actualizar cliente con user_id
        await cliente.update({ user_id: usuarioCliente.id }, { transaction });

        console.log('Ingenieros asignados al cliente:', ingenieros);
        const relacionesIngenieros = ingenieros.map((ing) => ({
          cliente_id: cliente.id,
          user_id: parseInt(ing.user_id),
          es_principal: !!ing.es_principal,
        }));

        await ClienteIngenieros.bulkCreate(relacionesIngenieros, { transaction });
        console.log('----------------------------');

        if (maquinasCount > 0) {
          const maquinas = Array.from({ length: maquinasCount }, (_, index) => ({
            tipo_maquina: 1,
            ancho_trabajo: 0,
            distancia_entrePicos: 0,
            numero_picos: 0,
            capacidad_tanque: 0,
            sistema_corte: 'Importado CSV',
            responsable: 'Importado CSV',
            cliente_id: cliente.id,
          }));
          const maquinasCreadas = await Maquinas.bulkCreate(maquinas, { transaction });

          // ✅ Crear calibración para cada máquina
          const calibraciones = maquinasCreadas.map((maquina) => ({
            maquina_id: maquina.id,
            fecha: null,
            responsable_id: null,
            alerta: false,
          }));
          await Calibraciones.bulkCreate(calibraciones, { transaction });
        }

        if (pozosCount > 0) {
          const pozos = Array.from({ length: pozosCount }, (_, index) => ({
            nombre: `Pozo importado ${index + 1}`,
            establecimiento: 'Importado CSV',
            cliente_id: cliente.id,
          }));
          const pozosCreados = await Pozo.bulkCreate(pozos, { transaction });

          // ✅ Crear muestra de agua para cada pozo
          const muestras = pozosCreados.map((pozo) => ({
            pozo_id: pozo.id,
            estado: 'PENDIENTE',
            alerta: false,
          }));
          await MuestraAgua.bulkCreate(muestras, { transaction });
        }

        if (jornadasCount > 0) {
          const jornadas = Array.from({ length: jornadasCount }, () => ({
            motivo: 'Jornada importada',
            observaciones: 'Importado desde CSV',
            cliente_id: cliente.id,
          }));
          await Jornada.bulkCreate(jornadas, { transaction });
        }

        console.log(`✅ Fila ${rowIndex + 2}: cliente importado "${razon_social}" con usuario, calibraciones y muestras`);
        importedCount += 1;
      });
    }

    console.log(`\nImportación finalizada: ${importedCount} clientes importados, ${skippedCount} filas omitidas.`);
  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};

importClients();