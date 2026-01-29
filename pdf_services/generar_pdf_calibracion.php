<?php
declare(strict_types=1);

// ===============================
// Configuración básica
// ===============================
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// ===============================
// Autoload de Composer (mPDF)
// ===============================
require __DIR__ . '/vendor/autoload.php';

use Mpdf\Mpdf;

// ===============================
// Leer JSON desde Node
// ===============================
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
  http_response_code(400);
  echo json_encode([
    'success' => false,
    'message' => 'JSON inválido o vacío'
  ]);
  exit;
}

// ===============================
// Validaciones mínimas
// ===============================
$required = ['cliente', 'fecha', 'maquina', 'estados'];

foreach ($required as $key) {
  if (!isset($data[$key])) {
    http_response_code(400);
    echo json_encode([
      'success' => false,
      'message' => "Falta el campo obligatorio: $key"
    ]);
    exit;
  }
}

// ===============================
// Preparar mPDF
// ===============================
try {
  $mpdf = new Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'margin_left' => 10,
    'margin_right' => 10,
    'margin_top' => 10,
    'margin_bottom' => 10,
    'default_font_size' => 10
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Error inicializando mPDF',
    'error' => $e->getMessage()
  ]);
  exit;
}

// ===============================
// Render del template
// ===============================
try {
  // El template usa $data
  ob_start();
  require __DIR__ . '/calibracion_reporte.php';
  $html = ob_get_clean();

  $mpdf->WriteHTML($html);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Error generando HTML del PDF',
    'error' => $e->getMessage()
  ]);
  exit;
}

// ===============================
// Guardar PDF
// ===============================
$baseDir = __DIR__ . '/generated';

if (!is_dir($baseDir)) {
  mkdir($baseDir, 0775, true);
}

$filename = 'calibracion_' . date('Ymd_His') . '.pdf';
$filepath = $baseDir . '/' . $filename;

try {
  $mpdf->Output($filepath, \Mpdf\Output\Destination::FILE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Error al guardar el PDF',
    'error' => $e->getMessage()
  ]);
  exit;
}

// ===============================
// Respuesta a Node
// ===============================
echo json_encode([
  'success' => true,
  'filename' => $filename,
  'url' => '/pdf_services/generated/' . $filename
]);
