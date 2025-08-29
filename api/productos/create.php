<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login('admin'); // solo admin

require_once __DIR__.'/../config/db.php';
$in = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$req = ['sku','nombre','categoria_id','unidad_id','precio_compra','precio_venta'];
foreach ($req as $k) if (!isset($in[$k])) { http_response_code(422); echo json_encode(['error'=>"Falta $k"]); exit; }

$sql = "INSERT INTO productos (sku,nombre,categoria_id,unidad_id,precio_compra,precio_venta,stock_minimo,activo)
        VALUES (:sku,:nombre,:cat,:uni,:pc,:pv,:min,:act)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
  ':sku'=>$in['sku'],
  ':nombre'=>$in['nombre'],
  ':cat'=>(int)$in['categoria_id'],
  ':uni'=>(int)$in['unidad_id'],
  ':pc'=>(float)$in['precio_compra'],
  ':pv'=>(float)$in['precio_venta'],
  ':min'=>isset($in['stock_minimo'])?(int)$in['stock_minimo']:0,
  ':act'=>isset($in['activo'])?(int)$in['activo']:1
]);

echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
