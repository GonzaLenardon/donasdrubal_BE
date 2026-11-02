import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analizarGrupo,
  construirRunsFaltantes,
  formatNumeroRemito,
  parseNumeroRemito,
  MAX_FALTANTES_DETALLE,
  UMBRAL_AGRUPACION,
} from './remitosFaltantesService.js';

test('parsea el número de remito tolerando padding y basura', () => {
  assert.equal(parseNumeroRemito('00000123'), 123);
  assert.equal(parseNumeroRemito('123'), 123);
  assert.equal(parseNumeroRemito(''), null);
  assert.equal(parseNumeroRemito('ABC'), null);
});

test('formatea el número con el ancho de la serie', () => {
  assert.equal(formatNumeroRemito(99, 8), '00000099');
  assert.equal(formatNumeroRemito(255, 8), '00000255');
});

test('el umbral de agrupación es 5', () => {
  assert.equal(UMBRAL_AGRUPACION, 5);
});

test('lista los faltantes uno por uno cuando la corrida no supera el umbral', () => {
  const runs = construirRunsFaltantes([4, 5, 6], UMBRAL_AGRUPACION);
  assert.deepEqual(runs, [
    { desde: 4, hasta: 4, cantidad: 1, agrupado: false },
    { desde: 5, hasta: 5, cantidad: 1, agrupado: false },
    { desde: 6, hasta: 6, cantidad: 1, agrupado: false },
  ]);
});

test('agrupa la corrida cuando supera el umbral', () => {
  const runs = construirRunsFaltantes([237, 238, 239, 240, 241, 242], UMBRAL_AGRUPACION);
  assert.deepEqual(runs, [
    { desde: 237, hasta: 242, cantidad: 6, agrupado: true },
  ]);
});

test('detecta los saltos de numeración de un depósito', () => {
  const remitos = [
    { remito_number: '00000001' },
    { remito_number: '00000002' },
    { remito_number: '00000003' },
    { remito_number: '00000007' },
    { remito_number: '00000040' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: true });

  assert.equal(analisis.totalFaltantes, 35);
  assert.equal(analisis.numeroMin, 1);
  assert.equal(analisis.numeroMax, 40);
  assert.equal(analisis.ancho, 8);
  assert.equal(analisis.faltantes[0].desde_texto, '00000004');
  assert.equal(analisis.faltantes[0].hasta_texto, '00000004');
  assert.equal(analisis.faltantes.at(-1).desde, 8);
  assert.equal(analisis.faltantes.at(-1).hasta, 39);
  assert.equal(analisis.faltantes.at(-1).agrupado, true);
});

test('modo detalle: todos los faltantes se listan uno por uno', () => {
  const remitos = [
    { remito_number: '00000001' },
    { remito_number: '00000040' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: false });

  assert.equal(analisis.totalFaltantes, 38);
  assert.equal(analisis.faltantes.length, 38);
  assert.ok(analisis.faltantes.every((faltante) => faltante.agrupado === false));
  assert.equal(analisis.faltantes[0].desde_texto, '00000002');
  assert.equal(analisis.faltantes.at(-1).desde_texto, '00000039');
});

test('modo agrupado: las corridas de más de 5 se muestran como rango', () => {
  const remitos = [
    { remito_number: '00000001' },
    { remito_number: '00000040' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: true });

  assert.equal(analisis.totalFaltantes, 38);
  assert.equal(analisis.faltantes.length, 1);
  assert.deepEqual(analisis.faltantes[0], {
    desde: 2,
    hasta: 39,
    cantidad: 38,
    agrupado: true,
    desde_texto: '00000002',
    hasta_texto: '00000039',
  });
});

test('intercala las filas de remitos y faltantes ordenadas por número', () => {
  const remitos = [
    { remito_number: '00000001' },
    { remito_number: '00000004' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: true });

  assert.deepEqual(
    analisis.filas.map((fila) =>
      fila.tipo === 'remito' ? `R${fila.numero}` : `F${fila.desde}`,
    ),
    ['R1', 'F2', 'F3', 'R4'],
  );
});

test('los remitos anulados cuentan como número usado', () => {
  const remitos = [
    { remito_number: '00000001', status: 'PENDIENTE' },
    { remito_number: '00000002', status: 'ANULADO' },
    { remito_number: '00000004' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: true });

  assert.equal(analisis.totalFaltantes, 1);
  assert.equal(analisis.faltantes[0].desde, 3);
});

test('no marca faltantes cuando la serie es continua', () => {
  const remitos = [
    { remito_number: '00000010' },
    { remito_number: '00000011' },
    { remito_number: '00000012' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: true });

  assert.equal(analisis.totalFaltantes, 0);
  assert.deepEqual(analisis.faltantes, []);
});

test('trunca la lista de faltantes en modo detalle cuando es enorme', () => {
  const remitos = [
    { remito_number: '00000001' },
    { remito_number: '00002000' },
  ];

  const analisis = analizarGrupo(remitos, { agrupar: false });

  assert.equal(analisis.totalFaltantes, 1998);
  assert.equal(analisis.faltantes.length, MAX_FALTANTES_DETALLE);
  assert.equal(analisis.truncado, true);
});
