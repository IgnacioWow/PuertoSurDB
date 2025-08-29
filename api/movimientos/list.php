<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol autenticado

// PuertoSurDB/api/movimientos/list.php
require_once __DIR__ . '/../config/db.php';

$producto_id = isset($_GET['producto_id']) ? (int)$_GET['producto_id'] : 0;

$sql = "SELECT id, producto_id, fecha, tipo, cantidad, costo_unitario, precio_unitario, referencia, nota
        FROM movimientos";
$params = [];

if ($producto_id > 0) {
  $sql .= " WHERE producto_id = :pid";
  $params[':pid'] = $producto_id;
}
$sql .= " ORDER BY fecha DESC, id DESC LIMIT 100";

$stmt = $pdo->prepare($sql);
foreach ($params as $k=>$v) $stmt->bindValue($k, $v, PDO::PARAM_INT);
$stmt->execute();

echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
