// import createUploader from './createUploader.js';
import createUploader from './multerConfig.js';

export const uploadCalibraciones = createUploader((req) => (
    console.log('Construyendo path para muestra de agua con:', req.body),
    {
  clienteId: req.body.cliente_id,
  tipo: 'maquinas',
  entidadId: req.body.maquina_id,
  subTipo: 'calibraciones',
  recursoId: req.body.calibracion_id,
}));
