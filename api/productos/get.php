<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol autenticado

require_once __DIR__.'/../config/db.php';
$id = (int)($_GET['id'] ?? 0);
if ($id<=0) { http_response_code(422); echo json_encode(['error'=>'Falta id']); exit; }

$sql = "SELECT p.*, c.nombre AS categoria, u.nombre AS unidad
        FROM productos p
        LEFT JOIN categorias c ON c.id=p.categoria_id
        LEFT JOIN unidades u ON u.id=p.unidad_id
        WHERE p.id=:id";
$stmt=$pdo->prepare($sql); $stmt->execute([':id'=>$id]);
echo json_encode($stmt->fetch() ?: []);
