<?php
// PuertoSurDB/api/auth/logout.php
require_once __DIR__ . '/../_auth.php';
$_SESSION = [];
if (session_status() !== PHP_SESSION_NONE) session_destroy();
echo json_encode(['ok'=>true]);
