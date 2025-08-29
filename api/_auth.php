<?php
// PuertoSurDB/api/_auth.php
if (session_status() === PHP_SESSION_NONE) session_start();

function require_login($role = null) {
  if (empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error'=>'no_auth']); exit;
  }
  if ($role && ($_SESSION['user']['rol'] !== $role)) {
    http_response_code(403);
    echo json_encode(['error'=>'forbidden']); exit;
  }
}

function user_or_null() {
  return $_SESSION['user'] ?? null;
}
