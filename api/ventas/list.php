<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$q         = trim($_GET['q'] ?? '');
$df        = trim($_GET['date_from'] ?? '');
$dt        = trim($_GET['date_to'] ?? '');
$page      = max(1, (int)($_GET['page'] ?? 1));
$per_page  = min(100, max(5, (int)($_GET['per_page'] ?? 20)));
$offset    = ($page-1)*$per_page;

$where = []; $params = [];
if ($q !== '') {
  $where[] = "(v.num_doc LIKE ? OR c.nombre LIKE ?)";
  $like = "%$q%"; $params = [$like,$like];
}
if ($df !== '') { $where[] = "DATE(v.fecha) >= ?"; $params[] = $df; }
if ($dt !== '') { $where[] = "DATE(v.fecha) <= ?"; $params[] = $dt; }

$W = $where ? ('WHERE '.implode(' AND ', $where)) : '';

/* total */
$sqlCount = "SELECT COUNT(*) FROM ventas v LEFT JOIN clientes c ON c.id=v.cliente_id $W";
$st = $pdo->prepare($sqlCount); $st->execute($params);
$total = (int)$st->fetchColumn();

/* page data */
$sql = "SELECT v.id,v.fecha,v.num_doc,v.subtotal,v.iva,v.total,v.anulada,
               c.nombre AS cliente
        FROM ventas v
        LEFT JOIN clientes c ON c.id=v.cliente_id
        $W
        ORDER BY v.id DESC
        LIMIT ? OFFSET ?";
$params2 = $params; $params2[] = $per_page; $params2[] = $offset;
$st = $pdo->prepare($sql); $st->execute($params2);
$items = $st->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
  'ok'=>true,
  'items'=>$items,
  'page'=>$page,
  'per_page'=>$per_page,
  'total'=>$total,
  'pages'=>max(1, (int)ceil($total/$per_page))
]);
