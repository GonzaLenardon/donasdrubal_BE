import fs from 'fs';
import path from 'path';

export const buildUploadPath = ({
  clienteId,
  tipo,          // 'maquinas' | 'pozos'
  entidadId,     // maquinaId | pozoId
  subTipo,       // 'calibraciones' | 'muestras'
  recursoId,     // calibracionId | muestraId
}) => {
  if (!clienteId || !tipo || !entidadId || !subTipo || !recursoId) {
    throw new Error('Faltan parámetros para construir el path');
  }

  const fullPath = path.join(
    process.cwd(),
    'uploads',
    'clientes',
    String(clienteId),
    tipo,
    String(entidadId),
    subTipo,
    String(recursoId)
  );

  fs.mkdirSync(fullPath, { recursive: true });

  return fullPath;
};