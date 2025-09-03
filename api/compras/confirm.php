<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$id = (int)($_POST['id'] ?? ($_GET['id'] ?? 0));
if ($id<=0){ http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'id requerido']); exit; }

$pdo->beginTransaction();
try{
  // items
  $st=$pdo->prepare("SELECT d.*, pr.sku FROM compras_det d JOIN productos pr ON pr.id=d.producto_id WHERE d.compra_id=?");
  $st->execute([$id]);
  $items=$st->fetchAll(PDO::FETCH_ASSOC);

  if(!$items){ throw new Exception("Sin ítems"); }

  // totales
  $subtotal=0; foreach($items as $it){ $subtotal += $it['cantidad']*$it['costo_unitario']; }
  $iva = round($subtotal*0.19,2); $total=round($subtotal+$iva,2);
  $st=$pdo->prepare("UPDATE compras SET subtotal=?, iva=?, total=? WHERE id=?");
  $st->execute([$subtotal,$iva,$total,$id]);

  // movimientos (evita duplicar por referencia C-<id>-<producto_id>)
  $ins=$pdo->prepare("INSERT INTO movimientos(producto_id,fecha,tipo,cantidad,costo_unitario,precio_unitario,referencia,nota)
                      VALUES(?,NOW(),'COMPRA',?,?,NULL,?,?)");
  $chk=$pdo->prepare("SELECT 1 FROM movimientos WHERE referencia=? LIMIT 1");
  foreach($items as $it){
    $ref = "C-{$id}-{$it['producto_id']}";
    $chk->execute([$ref]);
    if(!$chk->fetch()){
      $nota = "Compra #$id SKU {$it['sku']}";
      $ins->execute([$it['producto_id'],$it['cantidad'],$it['costo_unitario'],$ref,$nota]);
    }
  }

  $pdo->commit();
  echo json_encode(['ok'=>true,'subtotal'=>$subtotal,'iva'=>$iva,'total'=>$total]);
}catch(Exception $e){
  $pdo->rollBack();
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>$e->getMessage()]);
}
