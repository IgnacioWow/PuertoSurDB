<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$cliente_id = (int)($data['cliente_id'] ?? 0);
$fecha = $data['fecha'] ?? date('Y-m-d H:i:s');
$num_doc = trim($data['num_doc'] ?? '');
$st=$pdo->prepare("INSERT INTO ventas(cliente_id,fecha,num_doc,subtotal,iva,total) VALUES(?,?,?,?,?,?)");
$st->execute([$cliente_id?:null,$fecha,$num_doc,0,0,0]);
echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
