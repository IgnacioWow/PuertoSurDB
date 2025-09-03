<?php
// Incluir db.php aquí si aún no se incluyó en el endpoint
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'msg'=>'No autenticado']);
  exit;
}
