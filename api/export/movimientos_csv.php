<?php
// PuertoSurDB/api/export/movimientos_csv.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=movimientos.csv');

$out = fopen('php://output', 'w');
fputcsv($out, ['id','producto_id','sku','nombre','fecha','tipo','cantidad','costo_unitario','precio_unitario','referencia','nota']);

$sql = "
SELECT 
  m.id, p.id AS producto_id, p.sku, p.nombre, 
  DATE_FORMAT(m.fecha,'%Y-%m-%d %H:%i:%s') AS fecha,
  m.tipo, m.cantidad, m.costo_unitario, m.precio_unitario, m.referencia, m.nota
FROM movimientos m
JOIN productos p ON p.id = m.producto_id
ORDER BY m.fecha DESC, m.id DESC
";
$st = $pdo->query($sql);
while ($row = $st->fetch(PDO::FETCH_NUM)) fputcsv($out, $row);
