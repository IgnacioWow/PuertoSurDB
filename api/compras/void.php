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
  // ya anulada?
  $st=$pdo->prepare("SELECT anulada FROM compras WHERE id=? FOR UPDATE");
  $st->execute([$id]);
  $row=$st->fetch(PDO::FETCH_ASSOC);
  if(!$row){ throw new Exception("Compra no existe"); }
  if((int)$row['anulada']===1){ $pdo->commit(); echo json_encode(['ok'=>true,'msg'=>'ya anulada']); exit; }

  // items
  $st=$pdo->prepare("SELECT d.*, p.sku FROM compras_det d JOIN productos p ON p.id=d.producto_id WHERE d.compra_id=?");
  $st->execute([$id]);
  $items=$st->fetchAll(PDO::FETCH_ASSOC);
  if(!$items){ throw new Exception("Sin ítems"); }

  // movimientos reverso: DEV_COMPRA (salida)
  $ins=$pdo->prepare("INSERT INTO movimientos(producto_id,fecha,tipo,cantidad,costo_unitario,precio_unitario,referencia,nota)
                      VALUES(?,NOW(),'DEV_COMPRA',?,?,NULL,?,?)");
  foreach($items as $it){
    $ref="C-{$id}-{$it['producto_id']}-VOID";
    $nota="Anulación compra #$id SKU {$it['sku']}";
    $cantidad = -abs((int)$it['cantidad']);                // salida
    $ins->execute([$it['producto_id'],$cantidad,$it['costo_unitario'],$ref,$nota]);
  }

  $pdo->prepare("UPDATE compras SET anulada=1 WHERE id=?")->execute([$id]);
  $pdo->commit();
  echo json_encode(['ok'=>true]);
}catch(Exception $e){
  $pdo->rollBack();
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>$e->getMessage()]);
}
