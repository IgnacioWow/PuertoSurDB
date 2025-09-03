<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/../auth/require_login.php';
require_once __DIR__.'/../auth/require_role.php';
require_role('admin');

$id = (int)($_GET['id'] ?? 0);
if ($id<=0){ http_response_code(422); echo json_encode(['ok'=>false]); exit; }

$st = $pdo->prepare("UPDATE productos SET eliminado_en = NOW() WHERE id=?");
$st->execute([$id]);
echo json_encode(['ok'=>true]);
