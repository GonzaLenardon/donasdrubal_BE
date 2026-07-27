// import createUploader from './createUploader.js';
import createUploader from './multerConfig.js';

export const uploadMuestrasAgua = createUploader(
  (req) => (
    console.log('Construyendo path para muestra de agua con:', req.body),
    {
      clienteId: req.body.cliente_id,
      tipo: 'pozos',
      entidadId: req.body.pozo_id,
      subTipo: 'muestras',
      recursoId: req.body.muestra_agua_id,
    }
  ),
);

export const uploadJornadas = createUploader((req) => ({
  clienteId: req.body.cliente_id,
  tipo: 'jornadas',
  entidadId: req.body.jornada_id,
  // Sin subTipo/recursoId: Jornada no tiene un nivel de recurso anidado
  // propio (a diferencia de Calibración bajo Máquina, o Muestra bajo Pozo).
}));
