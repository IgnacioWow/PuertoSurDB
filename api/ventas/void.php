<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/../auth/require_login.php';
require_once __DIR__.'/../auth/require_role.php';
require_role('admin');

$id=(int)($_POST['id'] ?? ($_GET['id'] ?? 0));
if($id<=0){ http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'id requerido']); exit; }

$pdo->beginTransaction();
try{
  $st=$pdo->prepare("SELECT anulada FROM ventas WHERE id=? FOR UPDATE");
  $st->execute([$id]);
  $row=$st->fetch(PDO::FETCH_ASSOC);
  if(!$row){ throw new Exception("Venta no existe"); }
  if((int)$row['anulada']===1){ $pdo->commit(); echo json_encode(['ok'=>true,'msg'=>'ya anulada']); exit; }

  $st=$pdo->prepare("SELECT d.*, p.sku FROM ventas_det d JOIN productos p ON p.id=d.producto_id WHERE d.venta_id=?");
  $st->execute([$id]);
  $items=$st->fetchAll(PDO::FETCH_ASSOC);
  if(!$items){ throw new Exception("Sin ítems"); }

  // reverso: DEV_VENTA (entrada)
  $ins=$pdo->prepare("INSERT INTO movimientos(producto_id,fecha,tipo,cantidad,costo_unitario,precio_unitario,referencia,nota)
                      VALUES(?,NOW(),'DEV_VENTA',?,NULL,?, ?,?)");
  foreach($items as $it){
    $ref="V-{$id}-{$it['producto_id']}-VOID";
    $nota="Anulación venta #$id SKU {$it['sku']}";
    $cantidad = abs((int)$it['cantidad']);                 // entrada
    $ins->execute([$it['producto_id'],$cantidad,$it['precio_unitario'],$ref,$nota]);
  }

  $pdo->prepare("UPDATE ventas SET anulada=1 WHERE id=?")->execute([$id]);
  $pdo->commit();
  echo json_encode(['ok'=>true]);
}catch(Exception $e){
  $pdo->rollBack();
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>$e->getMessage()]);
}
