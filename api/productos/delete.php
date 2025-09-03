<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if ($id<=0){
  http_response_code(400);
  echo json_encode(['ok'=>false,'msg'=>'id inválido']);
  exit;
}

// TODO: validar que el usuario actual sea admin
$st = $pdo->prepare("UPDATE productos SET eliminado_en=NOW() WHERE id=?");
$st->execute([$id]);

echo json_encode(['ok'=>true]);
