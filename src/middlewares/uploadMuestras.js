// import createUploader from './createUploader.js';
import createUploader from './multerConfig.js';

export const uploadMuestrasAgua = createUploader((req) => (
    console.log('Construyendo path para muestra de agua con:', req.body),
    {
  clienteId: req.body.cliente_id,
  tipo: 'pozos',
  entidadId: req.body.pozo_id,
  subTipo: 'muestras',
  recursoId: req.body.muestra_agua_id,
}));
