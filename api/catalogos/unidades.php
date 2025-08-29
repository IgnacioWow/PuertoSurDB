<?php
// PuertoSurDB/api/catalogos/unidades.php
require_once __DIR__ . '/../config/db.php';
$stmt = $pdo->query("SELECT id, nombre, abreviatura FROM unidades ORDER BY nombre");
echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
