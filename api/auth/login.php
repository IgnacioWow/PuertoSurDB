<?php
// PuertoSurDB/api/auth/login.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';

$in = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$email = trim($in['email'] ?? '');
$pass  = $in['password'] ?? '';

if ($email === '' || $pass === '') {
  http_response_code(422); echo json_encode(['error'=>'missing']); exit;
}

$sql = "SELECT u.id, u.nombre, u.email, u.pass_hash, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE u.email = :email AND u.activo=1";
$st = $pdo->prepare($sql); $st->execute([':email'=>$email]);
$user = $st->fetch();

if (!$user || !password_verify($pass, $user['pass_hash'])) {
  http_response_code(401); echo json_encode(['error'=>'invalid_credentials']); exit;
}

$_SESSION['user'] = [
  'id' => (int)$user['id'],
  'nombre' => $user['nombre'],
  'email' => $user['email'],
  'rol' => $user['rol']
];

echo json_encode(['ok'=>true, 'user'=>$_SESSION['user']]);
