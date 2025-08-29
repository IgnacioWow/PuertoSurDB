<?php
// PuertoSurDB/api/auth/me.php
require_once __DIR__ . '/../_auth.php';
header('Content-Type: application/json; charset=utf-8');
$u = user_or_null();
if (!$u) { http_response_code(401); echo json_encode(['error'=>'no_auth']); exit; }
echo json_encode($u);
