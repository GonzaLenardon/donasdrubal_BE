# Remitos internos entre depósitos

## Alcance

Los remitos internos documentan y ejecutan el traslado de productos entre dos depósitos. Se registran como `NO_OFICIAL`, pero no son entregas a clientes: tienen un depósito destino, numeración propia y un flujo de confirmación distinto.

El alta se inicia desde **Remitos**, con la acción **Transferir entre depósitos**. El formulario permite seleccionar origen y destino, fecha y notas, y agregar productos con stock disponible en el origen. El cliente no participa en este flujo. El destino debe ser distinto del origen y ambos depósitos deben existir y estar activos.

## Modelo de datos

La tabla `remitos` representa el destino con dos referencias opcionales:

- Remito a cliente: `destination_client_id` informado y `destination_warehouse_id` nulo.
- Remito interno: `destination_client_id` nulo y `destination_warehouse_id` informado.

En ambos casos `origin_warehouse_id` identifica el depósito del que sale el stock. Los remitos existentes conservan su `destination_client_id`; la migración no los convierte ni cambia su numeración.

La regla de que haya exactamente un destino se valida en el backend al crear cada tipo de remito. No se agregó una restricción XOR a la base; escrituras directas a la tabla deben respetar la misma regla.

Las transferencias usan números con el prefijo `TR-` y el ID del remito (por ejemplo, `TR-00000123`). Esta serie no consume los números de remitos de clientes ni se incluye en el informe de faltantes de numeración de esas series.

## API y operación de stock

### Crear una transferencia

`POST /stock/remitos/internos`

Ejemplo de body:

```json
{
  "origin_warehouse_id": 1,
  "destination_warehouse_id": 2,
  "issued_at": "2026-11-03",
  "notes": "Traslado entre depósitos",
  "items": [
    {
      "product_variant_id": 17,
      "quantity_requested": 3
    }
  ]
}
```

La “variante” identifica la presentación específica de un producto (por ejemplo, tamaños/envases distintos del mismo producto) y su código. La cantidad solicitada se expresa en esa presentación; el backend la convierte a unidad base usando `cantidad_base`. La distribución de stock respeta los lotes disponibles del origen y registra en `remito_item_lots` cuánto se tomó de cada lote.

La creación y todos los cambios de stock se ejecutan en una única transacción. Por lote se descuenta una salida (`SALIDA`) del origen y se registra una entrada (`ENTRADA`) en destino. Ambos movimientos comparten la referencia al remito (`reference_type: remito_transfer`, `reference_id` y `remito_id`). Si el stock no alcanza o falla cualquier validación, se revierte toda la operación.

Una transferencia confirmada queda inmediatamente en estado `COMPLETADO`, con fecha de emisión y confirmación. No tiene etapa de revisión o recepción pendiente.

### Anular una transferencia

`PUT /stock/remitos/:id/cancel`

Los remitos internos completados pueden anularse. El backend resta del depósito destino la cantidad transferida de cada lote y la devuelve al origen, dentro de una transacción. Registra los movimientos inversos con `reference_type: remito_transfer_cancel`.

La anulación se rechaza si el destino no conserva suficiente cantidad de alguno de los lotes transferidos. En tal caso no se altera stock ni el estado del remito; primero debe resolverse la diferencia mediante la operación de stock correspondiente. Una transferencia ya anulada no puede anularse otra vez.

Las reglas de anulación de remitos de cliente se mantienen: no se pueden anular si ya están completados y los pendientes/revisión se revierten contra el depósito de origen.

## Acceso e historial

La ruta usa la misma autenticación general que las demás rutas protegidas de remitos; no añade un permiso exclusivo de Administrador para crear o anular transferencias. En el listado, los usuarios no administradores ven las transferencias internas que ellos crearon, junto a los remitos de clientes que ya pueden consultar.

El historial identifica las transferencias como internas y presenta origen, destino, fecha, productos, lotes, cantidades, notas, creador y estado. El filtro por depósito incluye tanto remitos cuyo origen como cuyo destino sea el depósito elegido. El detalle de un remito interno no ofrece acciones de carga de comprobante o confirmación propias de la entrega a cliente; sí permite anular una transferencia completada.

## Aplicar en base de datos

Aplicar la migración desde el backend:

```sh
npm run db:migrate
```

Las migraciones `20261103000001-add-internal-remitos.cjs` y `20261103000002-fix-remito-destination-nullability.cjs` permiten `NULL` en `destination_client_id` y agregan `destination_warehouse_id` con FK al depósito destino e índice de consulta. La segunda aplica explícitamente la modificación de nulabilidad para motores donde `changeColumn` no dejó el campo nullable. No se modifican destinos de remitos existentes.

El `down` se detiene si ya hay remitos internos, para no eliminar referencias de destino que identifican traslados registrados. Solo después de que no existan remitos internos podrá revertirse y volver a requerir `destination_client_id`.

El servidor usa `db.sync({ alter: false })`; por eso el despliegue debe aplicar la migración antes de usar la nueva ruta. No hace falta ni se debe ejecutar `sync({ force: true })`.

## Verificación

- Las pruebas backend cubren que la numeración `TR-...` no genere faltantes en la serie de remitos de clientes.
- Se validaron sintaxis del backend, lint dirigido de los archivos frontend modificados y build de producción del frontend.
- El lint global del frontend todavía reporta errores preexistentes en otros archivos; no forman parte de esta implementación.
