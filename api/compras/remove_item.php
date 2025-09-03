<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$compra_id=(int)($_GET['compra_id'] ?? 0);
$producto_id=(int)($_GET['producto_id'] ?? 0);
if($compra_id<=0||$producto_id<=0){ http_response_code(422); echo json_encode(['ok'=>false]); exit; }
$st=$pdo->prepare("DELETE FROM compras_det WHERE compra_id=? AND producto_id=?");
$st->execute([$compra_id,$producto_id]);
echo json_encode(['ok'=>true]);
