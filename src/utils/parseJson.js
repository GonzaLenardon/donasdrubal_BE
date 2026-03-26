// COnvierte los campos longtext con contenido JSON en PDFInvalidObjectParsingError. 
// Se utiliza en casos de que l abase de datos sea maria DB que no soporta campos JSON

export const parseJsonField = (field) => {
  if (typeof field === 'object' && field !== null) {
    return field;
  }

  let parsed = field;

  try {
    // Intentamos parsear múltiples veces por si está doble-encodeado
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (e) {
    console.warn('Error parseando JSON:', field);
    return null;
  }
};