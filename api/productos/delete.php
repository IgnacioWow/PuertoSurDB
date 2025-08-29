<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login('admin'); // solo admin

require_once __DIR__.'/../config/db.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : (int)(json_decode(file_get_contents('php://input'),true)['id'] ?? 0);
if ($id<=0) { http_response_code(422); echo json_encode(['error'=>'Falta id']); exit; }

$stmt = $pdo->prepare("UPDATE productos SET activo=0 WHERE id=:id");
$stmt->execute([':id'=>$id]);
echo json_encode(['ok'=>true,'deleted_logico'=>true]);
