<?php
// PuertoSurDB/api/auth/util_hash.php (usar 1 vez para generar un hash bcrypt)
header('Content-Type: text/plain; charset=utf-8');
$pwd = $_GET['pwd'] ?? 'admin123';
echo password_hash($pwd, PASSWORD_BCRYPT);
