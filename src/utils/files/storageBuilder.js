import fs from 'fs';
import path from 'path';

export const buildUploadPath = ({
  clienteId,
  tipo, // 'maquinas' | 'pozos' | 'jornadas' | ...
  entidadId, // maquinaId | pozoId | jornadaId
  subTipo, // 'calibraciones' | 'muestras' | 'informes' — opcional
  recursoId, // calibracionId | muestraId — opcional, va junto con subTipo
}) => {
  if (!clienteId || !tipo || !entidadId) {
    throw new Error('Faltan parámetros para construir el path');
  }

  // subTipo/recursoId son opcionales: solo aplican a entidades que tienen
  // un nivel de recurso anidado propio (ej: una máquina tiene calibraciones,
  // un pozo tiene muestras). Si se pasa uno sin el otro, es un error de
  // configuración — deben ir juntos o ninguno de los dos.
  if ((subTipo && !recursoId) || (!subTipo && recursoId)) {
    throw new Error(
      'subTipo y recursoId deben proporcionarse juntos o no proporcionarse',
    );
  }

  const segments = [
    process.cwd(),
    'uploads',
    'clientes',
    String(clienteId),
    tipo,
    String(entidadId),
  ];

  if (subTipo && recursoId) {
    segments.push(subTipo, String(recursoId));
  }

  const fullPath = path.join(...segments);

  fs.mkdirSync(fullPath, { recursive: true });

  return fullPath;
};
