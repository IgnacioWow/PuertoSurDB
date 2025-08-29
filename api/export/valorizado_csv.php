<?php
// PuertoSurDB/api/export/valorizado_csv.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol autenticado

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=valorizado.csv');

$out = fopen('php://output', 'w');
fputcsv($out, ['producto_id','sku','nombre','stock','costo_prom','valor_costo']);

$sql = "
SELECT 
  v.producto_id, v.sku, v.nombre, 
  v.stock, v.costo_prom, v.valor_costo
FROM v_valorizado v
ORDER BY v.nombre ASC
";
$st = $pdo->query($sql);
while ($row = $st->fetch(PDO::FETCH_NUM)) {
  fputcsv($out, $row);
}
