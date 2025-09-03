<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { http_response_code(400); echo json_encode(['ok'=>false,'msg'=>'JSON inválido']); exit; }

$producto_id = (int)($data['producto_id'] ?? 0);
$tipo = strtoupper(trim($data['tipo'] ?? ''));
$cantidad_in = (int)($data['cantidad'] ?? 0);
$costo_unitario = isset($data['costo_unitario']) ? (float)$data['costo_unitario'] : null;
$precio_unitario = isset($data['precio_unitario']) ? (float)$data['precio_unitario'] : null;
$referencia = trim($data['referencia'] ?? '');
$nota = trim($data['nota'] ?? '');

$validTipos = ['COMPRA','VENTA','AJUSTE_POS','AJUSTE_NEG','DEV_COMPRA','DEV_VENTA'];
if ($producto_id<=0 || $cantidad_in<=0 || !in_array($tipo,$validTipos)) {
  http_response_code(422); echo json_encode(['ok'=>false,'msg'=>'Campos inválidos']); exit;
}

// Signo según tipo (entradas + / salidas -)
$sign = in_array($tipo, ['COMPRA','AJUSTE_POS','DEV_VENTA']) ? 1 : -1;
$cantidad = $sign * $cantidad_in;

try {
  $st = $pdo->prepare("INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, precio_unitario, referencia, nota)
                       VALUES (?,?,?,?,?,?,?)");
  $st->execute([$producto_id,$tipo,$cantidad,$costo_unitario,$precio_unitario,$referencia,$nota]);
  echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
} catch (PDOException $e) {
  http_response_code(400); echo json_encode(['ok'=>false,'msg'=>'Error SQL','err'=>$e->getMessage()]);
}
