<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php'; // $pdo

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { http_response_code(400); echo json_encode(['ok'=>false,'msg'=>'JSON inválido']); exit; }

$id            = (int)($data['id'] ?? 0);
$sku           = trim($data['sku'] ?? '');
$nombre        = trim($data['nombre'] ?? '');
$categoria_id  = (int)($data['categoria_id'] ?? 0);
$unidad_id     = (int)($data['unidad_id'] ?? 0);
$precio_compra = (float)($data['precio_compra'] ?? 0);
$precio_venta  = (float)($data['precio_venta'] ?? 0);
$stock_minimo  = (int)($data['stock_minimo'] ?? 0);
$activo        = (int)($data['activo'] ?? 1);
$descripcion   = trim($data['descripcion'] ?? '');

if ($id<=0 || $sku==='' || $nombre==='' || $categoria_id<=0 || $unidad_id<=0) {
  http_response_code(422);
  echo json_encode(['ok'=>false,'msg'=>'Campos inválidos']);
  exit;
}

try {
  $sql = "UPDATE productos SET
            sku=?, nombre=?, categoria_id=?, unidad_id=?, precio_compra=?, precio_venta=?, stock_minimo=?, activo=?, descripcion=?
          WHERE id=?";
  $st = $pdo->prepare($sql);
  $st->execute([$sku,$nombre,$categoria_id,$unidad_id,$precio_compra,$precio_venta,$stock_minimo,$activo,$descripcion,$id]);
  echo json_encode(['ok'=>true]);
} catch (PDOException $e) {
  if ($e->getCode() === '23000') {
    $msg = 'Violación de restricción (¿SKU duplicado o FK inválida?).';
  } else {
    $msg = 'Error SQL';
  }
  http_response_code(400);
  echo json_encode(['ok'=>false,'msg'=>$msg,'err'=>$e->getMessage()]);
}
