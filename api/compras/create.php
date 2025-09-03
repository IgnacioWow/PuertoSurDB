<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$proveedor_id = (int)($data['proveedor_id'] ?? 0);
$fecha = $data['fecha'] ?? date('Y-m-d H:i:s');
$num_doc = trim($data['num_doc'] ?? '');

if ($proveedor_id<=0){ http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'proveedor_id requerido']); exit; }

$st=$pdo->prepare("INSERT INTO compras(proveedor_id,fecha,num_doc,subtotal,iva,total) VALUES(?,?,?,0,0,0)");
$st->execute([$proveedor_id,$fecha,$num_doc]);
echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
