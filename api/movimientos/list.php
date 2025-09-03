<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$q = trim($_GET['q'] ?? '');
$lim = max(1, min(200, (int)($_GET['lim'] ?? 50)));

$where = [];
$params = [];

if ($q!=='') {
  $where[] = "(p.sku LIKE ? OR p.nombre LIKE ? OR m.referencia LIKE ?)";
  $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%";
}

$sql = "SELECT m.id, m.fecha, m.tipo, m.cantidad, m.costo_unitario, m.precio_unitario, m.referencia, m.nota,
               p.id AS producto_id, p.sku, p.nombre
        FROM movimientos m
        JOIN productos p ON p.id = m.producto_id";
if ($where) $sql .= " WHERE ".implode(" AND ", $where);
$sql .= " ORDER BY m.fecha DESC, m.id DESC LIMIT $lim";

$st = $pdo->prepare($sql);
$st->execute($params);
echo json_encode(['ok'=>true,'items'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
