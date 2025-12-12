// matchea los campos definidos en el modelo con lo enviado desde el formatInTimeZone
// extraExclude = [] se usa para exluir algunos campos adicionales 
// ejemplo uso const payload = extractModelFields(User, req.body, ['password_hash']);

export function extractModelFields(model, data = {}, extraExclude = []) {
  const attributes = Object.keys(model.rawAttributes);
  const baseExclude = ['id', 'createdAt', 'updatedAt', 'deletedAt'];

  const exclude = [...baseExclude, ...extraExclude];

  const payload = {};

  for (const attr of attributes) {
    if (!exclude.includes(attr) && data.hasOwnProperty(attr)) {
      payload[attr] = data[attr];
    }
  }

  return payload;
}
