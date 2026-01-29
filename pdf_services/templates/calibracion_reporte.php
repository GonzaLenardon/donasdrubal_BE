<?php
// $data llega desde generar_calibracion.php
function v($arr, $key) {
  return $arr[$key] ?? '';
}

function estado($e) {
  return strtoupper($e['estado'] ?? 'NO APLICA');
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">

<style>
body {
  font-family: sans-serif;
  font-size: 11px;
  color: #222;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

h3 {
  padding: 6px;
  font-size: 12px;
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}

td {
  border: 1px solid #ccc;
  padding: 6px;
}

td.label {
  width: 35%;
  font-weight: bold;
  background: #f7f7f7;
}

/* Estados */
.estado-EXCELENTE { background: #c8f7c5; }
.estado-MUY\ BUENO { background: #dff0d8; }
.estado-BUENO { background: #fcf8e3; }
.estado-REGULAR { background: #f9e79f; }
.estado-MALO { background: #f5b7b1; }
.estado-REVISAR { background: #f1948a; }
.estado-NO\ APLICA { background: #eee; }

hr { margin: 20px 0; }
</style>

</head>
<body>

<h2>Diagnóstico y Puesta a Punto de Pulverizadora</h2>

<table>
<tr><td class="label">Cliente</td><td><?= v($data['cliente'],'razon_social') ?></td></tr>
<tr><td class="label">CUIT</td><td><?= v($data['cliente'],'cuil_cuit') ?></td></tr>
<tr><td class="label">Fecha</td><td><?= date('d/m/Y', strtotime($data['fecha'])) ?></td></tr>
<tr><td class="label">Responsable</td><td><?= $data['responsable'] ?></td></tr>
</table>

<h3>Datos de la Máquina</h3>
<table>
<tr><td class="label">Tipo</td><td><?= $data['maquina']['tipo'] ?></td></tr>
<tr><td class="label">Marca</td><td><?= $data['maquina']['marca'] ?></td></tr>
<tr><td class="label">Modelo</td><td><?= $data['maquina']['modelo'] ?></td></tr>
<tr><td class="label">Ancho de trabajo</td><td><?= $data['maquina']['ancho_trabajo'] ?></td></tr>
<tr><td class="label">Distancia entre picos</td><td><?= $data['maquina']['distancia_picos'] ?></td></tr>
<tr><td class="label">Número de picos</td><td><?= $data['maquina']['numero_picos'] ?></td></tr>
</table>

<hr>

<?php
$labels = [
  'maquina' => 'Estado General de la Máquina',
  'bomba' => 'Bomba',
  'agitador' => 'Agitador',
  'filtro_primario' => 'Filtro Primario',
  'filtro_secundario' => 'Filtro Secundario',
  'filtro_linea' => 'Filtro de Línea',
  'mangueras' => 'Mangueras y Conexiones',
  'antigoteo' => 'Antigoteo',
  'limpieza_tanque' => 'Limpieza de Tanque',
  'pastillas' => 'Pastillas',
  'botalon' => 'Estabilidad Vertical del Botalón',
  'mixer' => 'Mixer'
];

foreach ($labels as $key => $titulo):
  $e = $data['estados'][$key];
?>
<h3 class="estado-<?= estado($e) ?>">
  <?= $titulo ?> — <?= estado($e) ?>
</h3>

<table>
<tr><td class="label">Observación</td><td><?= $e['observacion'] ?: '—' ?></td></tr>
<?php if ($e['color']): ?><tr><td class="label">Color</td><td><?= $e['color'] ?></td></tr><?php endif; ?>
<?php if ($e['numero']): ?><tr><td class="label">Valor / Nº</td><td><?= $e['numero'] ?></td></tr><?php endif; ?>
<?php if ($e['modelo']): ?><tr><td class="label">Modelo</td><td><?= $e['modelo'] ?></td></tr><?php endif; ?>
<?php if ($e['materiales']): ?><tr><td class="label">Material</td><td><?= $e['materiales'] ?></td></tr><?php endif; ?>
<?php if ($e['presenciaORing']): ?><tr><td class="label">O-Ring</td><td><?= $e['presenciaORing'] ?></td></tr><?php endif; ?>
</table>

<?php if ($e['nombreArchivo']): ?>
<img src="/uploads/calibraciones/<?= $e['nombreArchivo'] ?>" style="width:300px;border:1px solid #ccc;">
<?php endif; ?>

<?php if (!empty($e['recomendaciones'])): ?>
<p><b>Recomendaciones:</b></p>
<ul>
<?php foreach ($e['recomendaciones'] as $r): ?>
<li><?= $r['texto'] ?></li>
<?php endforeach; ?>
</ul>
<?php endif; ?>

<?php endforeach; ?>

<hr>

<h3>Mediciones de Presión</h3>
<table>
<tr><td class="label">UNIMAP</td><td><?= $data['presiones']['unimap'] ?> bar</td></tr>
<tr><td class="label">Computadora</td><td><?= $data['presiones']['computadora'] ?> bar</td></tr>
<tr><td class="label">Manómetro</td><td><?= $data['presiones']['manometro'] ?> bar</td></tr>
</table>

<?php if (!empty($data['presiones']['secciones'])): ?>
<h3>Presiones por Sección</h3>
<table>
<?php foreach ($data['presiones']['secciones'] as $s): ?>
<tr>
<td class="label">Sección <?= $s['seccion'] ?></td>
<td><?= $s['presion'] ?> bar</td>
</tr>
<?php endforeach; ?>
</table>
<?php endif; ?>

<h3>Observaciones Acronex</h3>
<p><?= $data['observaciones']['acronex'] ?: '—' ?></p>

<h3>Observaciones Generales</h3>
<p><?= $data['observaciones']['generales'] ?: '—' ?></p>

</body>
</html>
