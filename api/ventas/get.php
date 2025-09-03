<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$id=(int)($_GET['id'] ?? 0);
if($id<=0){ http_response_code(422); echo json_encode(['ok'=>false]); exit; }

$st=$pdo->prepare("SELECT v.*, c.nombre cliente FROM ventas v LEFT JOIN clientes c ON c.id=v.cliente_id WHERE v.id=?");
$st->execute([$id]);
$venta=$st->fetch(PDO::FETCH_ASSOC);
if(!$venta){ http_response_code(404); echo json_encode(['ok'=>false]); exit; }

$st=$pdo->prepare("SELECT d.producto_id,d.cantidad,d.precio_unitario, p.sku,p.nombre
                   FROM ventas_det d JOIN productos p ON p.id=d.producto_id WHERE d.venta_id=?");
$st->execute([$id]);
$items=$st->fetchAll(PDO::FETCH_ASSOC);

$subtotal=0; foreach($items as $it){ $subtotal += $it['cantidad']*$it['precio_unitario']; }
$iva=round($subtotal*0.19,2); $total=round($subtotal+$iva,2);

echo json_encode(['ok'=>true,'venta'=>$venta,'items'=>$items,'subtotal'=>$subtotal,'iva'=>$iva,'total'=>$total]);
