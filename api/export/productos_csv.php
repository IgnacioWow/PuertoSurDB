<?php
// PuertoSurDB/api/export/productos_csv.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=productos.csv');

$out = fopen('php://output', 'w');
fputcsv($out, ['id','sku','nombre','categoria','unidad','precio_compra','precio_venta','stock_minimo','stock_actual','activo']);

$sql = "
SELECT 
  p.id, p.sku, p.nombre, c.nombre AS categoria, u.nombre AS unidad,
  p.precio_compra, p.precio_venta, p.stock_minimo,
  COALESCE(v.stock,0) AS stock_actual, p.activo
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN unidades u ON u.id = p.unidad_id
LEFT JOIN v_stock_actual v ON v.producto_id = p.id
ORDER BY p.nombre ASC
";
$st = $pdo->query($sql);
while ($row = $st->fetch(PDO::FETCH_NUM)) fputcsv($out, $row);
