import db from '../config/database.js';
import { QueryTypes } from 'sequelize';

const DRY_RUN = process.argv.includes('--dry-run');

const principalIngenierosSubquery = `
  SELECT
    cliente_id,
    MIN(user_id) AS responsable_id
  FROM cliente_ingenieros
  WHERE es_principal = 1
  GROUP BY cliente_id
`;

const countValue = (rows) => Number(rows?.[0]?.total || 0);

const countRows = async (sql, transaction) => {
  const rows = await db.query(sql, {
    type: QueryTypes.SELECT,
    transaction,
  });

  return countValue(rows);
};

const updateResponsables = async () => {
  const transaction = await db.transaction();

  try {
    await db.authenticate();

    const jornadasConPrincipal = await countRows(
      `
        SELECT COUNT(*) AS total
        FROM jornadas j
        INNER JOIN (${principalIngenierosSubquery}) principal
          ON principal.cliente_id = j.cliente_id
        WHERE j.responsable_id IS NULL
      `,
      transaction,
    );

    const muestrasConPrincipal = await countRows(
      `
        SELECT COUNT(*) AS total
        FROM muestras_aguas ma
        INNER JOIN pozos p
          ON p.id = ma.pozo_id
        INNER JOIN (${principalIngenierosSubquery}) principal
          ON principal.cliente_id = p.cliente_id
        WHERE ma.responsable_id IS NULL
      `,
      transaction,
    );

    const jornadasSinPrincipal = await countRows(
      `
        SELECT COUNT(*) AS total
        FROM jornadas j
        LEFT JOIN (${principalIngenierosSubquery}) principal
          ON principal.cliente_id = j.cliente_id
        WHERE j.responsable_id IS NULL
          AND principal.responsable_id IS NULL
      `,
      transaction,
    );

    const muestrasSinPrincipal = await countRows(
      `
        SELECT COUNT(*) AS total
        FROM muestras_aguas ma
        INNER JOIN pozos p
          ON p.id = ma.pozo_id
        LEFT JOIN (${principalIngenierosSubquery}) principal
          ON principal.cliente_id = p.cliente_id
        WHERE ma.responsable_id IS NULL
          AND principal.responsable_id IS NULL
      `,
      transaction,
    );

    console.log('Resumen previo:');
    console.log(`- Jornadas a actualizar: ${jornadasConPrincipal}`);
    console.log(`- Muestras de agua a actualizar: ${muestrasConPrincipal}`);
    console.log(`- Jornadas sin ingeniero principal: ${jornadasSinPrincipal}`);
    console.log(`- Muestras de agua sin ingeniero principal: ${muestrasSinPrincipal}`);

    if (!DRY_RUN) {
      await db.query(
        `
          UPDATE jornadas j
          INNER JOIN (${principalIngenierosSubquery}) principal
            ON principal.cliente_id = j.cliente_id
          SET j.responsable_id = principal.responsable_id
          WHERE j.responsable_id IS NULL
        `,
        { transaction },
      );

      await db.query(
        `
          UPDATE muestras_aguas ma
          INNER JOIN pozos p
            ON p.id = ma.pozo_id
          INNER JOIN (${principalIngenierosSubquery}) principal
            ON principal.cliente_id = p.cliente_id
          SET ma.responsable_id = principal.responsable_id
          WHERE ma.responsable_id IS NULL
        `,
        { transaction },
      );
    }

    if (DRY_RUN) {
      await transaction.rollback();
      console.log('\nDry run finalizado. No se aplicaron cambios.');
      return;
    }

    await transaction.commit();
    console.log('\nActualizacion finalizada correctamente.');
  } catch (error) {
    await transaction.rollback();
    console.error('\nError al actualizar responsables:', error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};

updateResponsables();
