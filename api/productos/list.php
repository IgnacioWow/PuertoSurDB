<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login(); // cualquier rol autenticado

// PuertoSurDB/api/productos/list.php
require_once __DIR__ . '/../config/db.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$limit = max(1, (int)($_GET['limit'] ?? 20));
$offset = max(0, (int)($_GET['offset'] ?? 0));

$sql = "SELECT p.id, p.sku, p.nombre, c.nombre AS categoria,
        COALESCE(v.stock,0) AS stock, p.precio_venta
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN v_stock_actual v ON v.producto_id = p.id
        WHERE p.activo = 1";
$params = [];

if ($q !== '') {
  $sql .= " AND (p.nombre LIKE :q OR p.sku LIKE :q)";
  $params[':q'] = "%$q%";
}

$sql .= " ORDER BY p.nombre ASC LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v, PDO::PARAM_STR);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

echo json_encode([
  'items' => $stmt->fetchAll(),
  'limit' => $limit,
  'offset' => $offset
], JSON_UNESCAPED_UNICODE);
