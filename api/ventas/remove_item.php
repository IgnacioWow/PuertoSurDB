<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$venta_id=(int)($_GET['venta_id'] ?? 0);
$producto_id=(int)($_GET['producto_id'] ?? 0);
if($venta_id<=0||$producto_id<=0){ http_response_code(422); echo json_encode(['ok'=>false]); exit; }
$st=$pdo->prepare("DELETE FROM ventas_det WHERE venta_id=? AND producto_id=?");
$st->execute([$venta_id,$producto_id]);
echo json_encode(['ok'=>true]);
