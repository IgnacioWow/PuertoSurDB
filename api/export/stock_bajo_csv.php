<?php
// PuertoSurDB/api/export/stock_bajo_csv.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=stock_bajo.csv');

$out = fopen('php://output', 'w');
fputcsv($out, ['id','sku','nombre','categoria','stock_actual','stock_minimo','faltante']);

$sql = "
SELECT 
  p.id, p.sku, p.nombre, c.nombre AS categoria,
  COALESCE(v.stock,0) AS stock_actual,
  p.stock_minimo,
  GREATEST(p.stock_minimo - COALESCE(v.stock,0), 0) AS faltante
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN v_stock_actual v ON v.producto_id = p.id
WHERE p.activo = 1
  AND COALESCE(v.stock,0) <= p.stock_minimo
ORDER BY faltante DESC, p.nombre ASC
";
$st = $pdo->query($sql);
while ($row = $st->fetch(PDO::FETCH_NUM)) fputcsv($out, $row);
