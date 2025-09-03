<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$st=$pdo->query("SELECT id,nombre FROM proveedores ORDER BY nombre");
echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
