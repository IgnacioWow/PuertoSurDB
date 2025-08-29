<?php
// PuertoSurDB/api/reportes/stock_bajo.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol

$sql = "
SELECT 
  p.id, p.sku, p.nombre, c.nombre AS categoria,
  COALESCE(v.stock,0) AS stock_actual,
  p.stock_minimo
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN v_stock_actual v ON v.producto_id = p.id
WHERE p.activo = 1
  AND COALESCE(v.stock,0) <= p.stock_minimo
ORDER BY (COALESCE(v.stock,0) - p.stock_minimo) ASC, p.nombre ASC
";
$st = $pdo->query($sql);
echo json_encode($st->fetchAll(), JSON_UNESCAPED_UNICODE);
