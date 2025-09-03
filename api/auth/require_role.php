<?php
// Requiere require_login.php antes de incluirlo
function require_role($roles) {
  if (!is_array($roles)) $roles = [$roles];
  $rol = $_SESSION['user_rol'] ?? null;      // p.ej. 'admin' | 'vendedor'
  if (!$rol || !in_array($rol, $roles, true)) {
    http_response_code(403);
    echo json_encode(['ok'=>false,'msg'=>'Permiso denegado']);
    exit;
  }
}
