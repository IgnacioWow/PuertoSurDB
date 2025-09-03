<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];

$venta_id   = (int)($data['venta_id'] ?? 0);
$producto_id= (int)($data['producto_id'] ?? 0);
$cantidad   = (int)($data['cantidad'] ?? 0);
$precio     = (float)($data['precio_unitario'] ?? 0);
if ($venta_id<=0 || $producto_id<=0 || $cantidad<=0 || $precio<0){
  http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'datos inválidos']); exit;
}

/* stock disponible */
$st=$pdo->prepare("SELECT COALESCE(v.stock,0) stock FROM v_stock_actual v WHERE v.producto_id=?");
$st->execute([$producto_id]);
$stock=(int)($st->fetchColumn() ?: 0);

/* cantidad ya agregada en esta venta (si editas) */
$st=$pdo->prepare("SELECT cantidad FROM ventas_det WHERE venta_id=? AND producto_id=?");
$st->execute([$venta_id,$producto_id]);
$ya = (int)($st->fetchColumn() ?: 0);

if ($cantidad > $stock + $ya) {
  http_response_code(409);
  echo json_encode(['ok'=>false,'msg'=>"Stock insuficiente. Disponible: ".max(0,$stock+$ya)]);
  exit;
}

/* upsert */
$sql="INSERT INTO ventas_det (venta_id,producto_id,cantidad,precio_unitario)
      VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE cantidad=VALUES(cantidad), precio_unitario=VALUES(precio_unitario)";
$st=$pdo->prepare($sql);
$st->execute([$venta_id,$producto_id,$cantidad,$precio]);
echo json_encode(['ok'=>true]);
