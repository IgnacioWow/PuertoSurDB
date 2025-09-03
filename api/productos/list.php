<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

// ================================
// 1. Capturar parámetros GET
// ================================
$q = trim($_GET['q'] ?? '');           // búsqueda por nombre o SKU
$estado = $_GET['estado'] ?? 'activos'; // activos|inactivos|eliminados|todos

$where = [];
$params = [];

// ================================
// 2. Filtrar según estado
// ================================
// Eliminados
<?php
// ...
require_once __DIR__.'/../auth/require_login.php';
// $_SESSION['user_rol'] disponible
$isAdmin = (($_SESSION['user_rol'] ?? '') === 'admin');

$q = trim($_GET['q'] ?? '');
$estado = $_GET['estado'] ?? 'activos';
$where = []; $params = [];

// Eliminados
if ($estado === 'eliminados') {
  if ($isAdmin) {
    $where[] = "p.eliminado_en IS NOT NULL";
  } else {
    // fuerza a no ver eliminados si no es admin
    $where[] = "p.eliminado_en IS NULL AND 1=0";
  }
} elseif ($estado === 'todos') {
  if (!$isAdmin) $where[] = "p.eliminado_en IS NULL";
} else {
  $where[] = "p.eliminado_en IS NULL";
  if ($estado === 'activos')   $where[] = "p.activo = 1";
  if ($estado === 'inactivos') $where[] = "p.activo = 0";
}


// ================================
// 3. Filtro por texto (búsqueda)
// ================================
if ($q !== '') {
    $where[] = "(p.sku LIKE ? OR p.nombre LIKE ?)";
    $like = "%$q%";
    $params[] = $like;
    $params[] = $like;
}

// ================================
// 4. Query SQL
// ================================
$sql = "SELECT 
          p.id, 
          p.sku, 
          p.nombre, 
          p.precio_venta, 
          p.activo, 
          p.eliminado_en,
          c.nombre AS categoria,
          COALESCE(v.stock,0) AS stock
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN v_stock_actual v ON v.producto_id = p.id";

// Aplicar los filtros construidos dinámicamente
if ($where) {
    $sql .= " WHERE " . implode(" AND ", $where);
}

$sql .= " ORDER BY p.id DESC";

// ================================
// 5. Ejecutar consulta
// ================================
$st = $pdo->prepare($sql);
$st->execute($params);
$items = $st->fetchAll(PDO::FETCH_ASSOC);

// ================================
// 6. Respuesta JSON
// ================================
echo json_encode(['ok' => true, 'items' => $items]);
