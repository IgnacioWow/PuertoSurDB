<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

/* Devuelve productos activos (no eliminados) cuyo stock actual <= stock_minimo */
$sql = "SELECT 
          p.id, p.sku, p.nombre, p.stock_minimo,
          COALESCE(v.stock,0) AS stock_actual
        FROM productos p
        LEFT JOIN v_stock_actual v ON v.producto_id = p.id
        WHERE p.activo = 1
          AND (p.eliminado_en IS NULL OR p.eliminado_en = '0000-00-00 00:00:00')
          AND COALESCE(v.stock,0) <= p.stock_minimo
        ORDER BY stock_actual ASC, p.nombre ASC";

$st = $pdo->query($sql);
echo json_encode(['ok'=>true,'items'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
