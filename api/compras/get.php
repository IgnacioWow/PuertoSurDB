<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$id = (int)($_GET['id'] ?? 0);
if ($id<=0){ http_response_code(422); echo json_encode(['ok'=>false]); exit; }

$st=$pdo->prepare("SELECT c.*, p.nombre proveedor FROM compras c JOIN proveedores p ON p.id=c.proveedor_id WHERE c.id=?");
$st->execute([$id]);
$compra=$st->fetch(PDO::FETCH_ASSOC);
if(!$compra){ http_response_code(404); echo json_encode(['ok'=>false]); exit; }

$st=$pdo->prepare("SELECT d.producto_id,d.cantidad,d.costo_unitario, pr.sku,pr.nombre
                   FROM compras_det d JOIN productos pr ON pr.id=d.producto_id
                   WHERE d.compra_id=?");
$st->execute([$id]);
$items=$st->fetchAll(PDO::FETCH_ASSOC);

$subtotal=0;
foreach($items as $it){ $subtotal += $it['cantidad'] * $it['costo_unitario']; }
$iva = round($subtotal * 0.19, 2);
$total = round($subtotal + $iva, 2);

echo json_encode(['ok'=>true,'compra'=>$compra,'items'=>$items,'subtotal'=>$subtotal,'iva'=>$iva,'total'=>$total]);
