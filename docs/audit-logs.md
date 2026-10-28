# Auditoría centralizada

## Implementación

`audit_logs` contiene actor nullable (FK `users.id`, `ON DELETE SET NULL`), tipo de actor, módulo, acción, entidad e identificador polimórfico en texto, valores JSON, campos cambiados, descripción, correlación HTTP, resultado y `created_at` con precisión de milisegundos. Los índices cubren usuario/fecha, entidad/ID/fecha, módulo/fecha, acción/fecha y request ID.

Los hooks centrales registran `CREATE`, `UPDATE`, `DELETE` y `STATUS_CHANGE` para operaciones de instancia y masivas Sequelize. Para operaciones masivas de actualización/borrado, primero consultan las filas afectadas y luego comparan sus valores; esto añade lecturas proporcionales al tamaño del lote. Los `destroy()` lógicos se describen como cambios de estado. Los logs no tienen endpoints de edición o borrado y la propia tabla se excluye de los hooks.

La consulta `GET /audit-logs` exige autenticación y rol Administrador, pagina por defecto a 50 (máximo 100), ordena por fecha e ID descendentes y valida los filtros. La migración crea el permiso `AUDIT_READ` y lo asigna a los roles `Administrador` existentes. El middleware actual solo aplica roles; el permiso se deja sembrado para conectarlo cuando el proyecto centralice la autorización por permisos.

`AsyncLocalStorage` agrega request ID (acepta `x-request-id` seguro o genera UUID), actor, IP, user-agent, método y endpoint. Para trabajos sin petición, el actor se registra como `system`; el servicio admite actor/contexto explícitos.

## Aplicar en base de datos

En desarrollo y producción aplicar la migración con el comando ya configurado:

```sh
npm run db:migrate
```

La migración no borra ni altera tablas existentes. El arranque también usa `db.sync({ alter: false })`, que crea tablas faltantes; en despliegues se recomienda ejecutar la migración antes del backend para que el historial de Sequelize CLI registre el esquema. No ejecutar `sync({ force: true })`.

## Límites y operación

- SQL directo, mutaciones externas y scripts que no carguen `models/index.js` no quedan cubiertos de forma automática; esas rutas deben llamar explícitamente a `AuditLogService`.
- Si una operación participa de una transacción Sequelize, la fila de auditoría se escribe en esa transacción y revierte con ella. Para operaciones sin transacción, una falla al insertar el log puede ocurrir después de confirmarse la mutación; las escrituras críticas deben usar transacciones explícitas.
- Las contraseñas, hashes, salt, tokens, cookies, secretos, credenciales y binarios se excluyen recursivamente. No se registra el body HTTP.
- El historial es de solo lectura desde la API, pero un administrador con acceso directo a MySQL puede modificarlo. No implementa inmutabilidad criptográfica.
- Acordar retención según política legal/operativa; archivar por rangos de `created_at` y conservar copia fuera de la base activa antes de purgar. No se configura borrado automático.
- `ERM` utiliza módulo y tabla compartidos dentro de este backend/base. Si se separa la base del ERM, debe publicar el mismo contrato de evento hacia una base central o un colector, con entrega idempotente y sin reemplazar kardex/movimientos operativos.

## Cobertura pendiente

Las operaciones masivas y SQL directo deben instrumentarse explícitamente. Las mutaciones multi-entidad individuales sí generan un evento por cada modelo afectado; pueden representar detalles de implementación además del evento de negocio. Confirmación/anulación de remitos y transferencias requieren eventos de negocio explícitos si se quiere describir la intención de la operación, además del CRUD observado.
