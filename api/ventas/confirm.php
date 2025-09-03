<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$id=(int)($_POST['id'] ?? ($_GET['id'] ?? 0));
if($id<=0){ http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'id requerido']); exit; }

$pdo->beginTransaction();
try{
  $st=$pdo->prepare("SELECT d.*, p.sku FROM ventas_det d JOIN productos p ON p.id=d.producto_id WHERE d.venta_id=?");
  $st->execute([$id]);
  $items=$st->fetchAll(PDO::FETCH_ASSOC);
  if(!$items){ throw new Exception("Sin ítems"); }

  $subtotal=0; foreach($items as $it){ $subtotal += $it['cantidad']*$it['precio_unitario']; }
  $iva=round($subtotal*0.19,2); $total=round($subtotal+$iva,2);
  $st=$pdo->prepare("UPDATE ventas SET subtotal=?, iva=?, total=? WHERE id=?");
  $st->execute([$subtotal,$iva,$total,$id]);

  $ins=$pdo->prepare("INSERT INTO movimientos(producto_id,fecha,tipo,cantidad,costo_unitario,precio_unitario,referencia,nota)
                      VALUES(?,NOW(),'VENTA',?,NULL,?,?,?)");
  $chk=$pdo->prepare("SELECT 1 FROM movimientos WHERE referencia=? LIMIT 1");

  foreach($items as $it){
    $ref="V-{$id}-{$it['producto_id']}";
    $chk->execute([$ref]);
    if(!$chk->fetch()){
      $nota="Venta #$id SKU {$it['sku']}";
      $cantidad = -abs((int)$it['cantidad']);
      $ins->execute([$it['producto_id'],$cantidad,$it['precio_unitario'],$ref,$nota]);
    }
  }

  $pdo->commit();
  echo json_encode(['ok'=>true,'subtotal'=>$subtotal,'iva'=>$iva,'total'=>$total]);
}catch(Exception $e){
  $pdo->rollBack();
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>$e->getMessage()]);
}
