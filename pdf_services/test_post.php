<?php
echo json_encode([
  'method' => $_SERVER['REQUEST_METHOD'],
  'input' => file_get_contents('php://input')
]);
