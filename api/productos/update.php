<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login('admin'); // solo admin

require_once __DIR__.'/../config/db.php';
$in = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$id = isset($in['id']) ? (int)$in['id'] : 0;
if ($id<=0) { http_response_code(422); echo json_encode(['error'=>'Falta id']); exit; }

$campos = ['sku','nombre','categoria_id','unidad_id','precio_compra','precio_venta','stock_minimo','activo'];
$sets=[]; $params=[':id'=>$id];
foreach ($campos as $c) {
  if (array_key_exists($c,$in)) {
    $sets[] = "$c = :$c";
    $params[":$c"] = $in[$c];
  }
}
if (!$sets) { echo json_encode(['ok'=>true,'msg'=>'Nada que actualizar']); exit; }

$sql = "UPDATE productos SET ".implode(',', $sets)." WHERE id=:id";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
echo json_encode(['ok'=>true,'updated'=>$stmt->rowCount()]);
