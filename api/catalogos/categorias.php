<?php
// PuertoSurDB/api/catalogos/categorias.php
require_once __DIR__ . '/../config/db.php';
$stmt = $pdo->query("SELECT id, nombre FROM categorias ORDER BY nombre");
echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
