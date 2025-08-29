<?php
// PuertoSurDB/api/reportes/valorizado.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol autenticado

header('Content-Type: application/json; charset=utf-8');

$sql = "
SELECT 
  v.producto_id, v.sku, v.nombre, 
  v.stock, v.costo_prom, v.valor_costo
FROM v_valorizado v
ORDER BY v.nombre ASC
";
$st = $pdo->query($sql);
$data = $st->fetchAll();

$total_valor = array_sum(array_column($data, 'valor_costo'));

echo json_encode([
  'total_valor' => $total_valor,
  'items' => $data
], JSON_UNESCAPED_UNICODE);
