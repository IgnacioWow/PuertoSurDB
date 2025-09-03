<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];

$compra_id   = (int)($data['compra_id'] ?? 0);
$producto_id = (int)($data['producto_id'] ?? 0);
$cantidad    = (int)($data['cantidad'] ?? 0);
$costo       = (float)($data['costo_unitario'] ?? 0);

if ($compra_id<=0 || $producto_id<=0 || $cantidad<=0 || $costo<0){
  http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'datos inválidos']); exit;
}

try{
  // upsert por UNIQUE(compra_id,producto_id)
  $sql = "INSERT INTO compras_det (compra_id,producto_id,cantidad,costo_unitario)
          VALUES (?,?,?,?)
          ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), costo_unitario = VALUES(costo_unitario)";
  $st=$pdo->prepare($sql);
  $st->execute([$compra_id,$producto_id,$cantidad,$costo]);
  echo json_encode(['ok'=>true]);
}catch(PDOException $e){
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>'Error SQL','err'=>$e->getMessage()]);
}
