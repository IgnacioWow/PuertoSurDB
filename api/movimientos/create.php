<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../_auth.php';
require_login('admin'); // solo admin

// PuertoSurDB/api/movimientos/create.php
require_once __DIR__ . '/../config/db.php';

/*
Entrada JSON/POST esperada:
{
  "producto_id": 1,
  "tipo": "COMPRA" | "VENTA" | "AJUSTE_POS" | "AJUSTE_NEG" | "DEV_COMPRA" | "DEV_VENTA",
  "cantidad": 5,                       // número positivo
  "costo_unitario": 5000,              // requerido en entradas (COMPRA, AJUSTE_POS, DEV_VENTA)
  "precio_unitario": 7990,             // requerido en salidas  (VENTA, AJUSTE_NEG, DEV_COMPRA)
  "referencia": "V-0001",
  "nota": "detalle opcional"
}
*/

$in = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$producto_id = (int)($in['producto_id'] ?? 0);
$tipo        = trim($in['tipo'] ?? '');
$cantidad    = (int)($in['cantidad'] ?? 0);
$costo_u     = isset($in['costo_unitario']) ? (float)$in['costo_unitario'] : null;
$precio_u    = isset($in['precio_unitario']) ? (float)$in['precio_unitario'] : null;
$referencia  = trim($in['referencia'] ?? '');
$nota        = trim($in['nota'] ?? '');

$tipos_validos = ['COMPRA','VENTA','AJUSTE_POS','AJUSTE_NEG','DEV_COMPRA','DEV_VENTA'];
if ($producto_id <= 0) { http_response_code(422); echo json_encode(['error'=>'Falta producto_id']); exit; }
if (!in_array($tipo, $tipos_validos, true)) { http_response_code(422); echo json_encode(['error'=>'tipo inválido']); exit; }
if ($cantidad <= 0) { http_response_code(422); echo json_encode(['error'=>'cantidad debe ser > 0']); exit; }

// Validar existencia de producto y que esté activo
$st = $pdo->prepare("SELECT id, activo FROM productos WHERE id=:id");
$st->execute([':id'=>$producto_id]);
$prod = $st->fetch();
if (!$prod || (int)$prod['activo'] !== 1) { http_response_code(422); echo json_encode(['error'=>'Producto no existe o inactivo']); exit; }

// Determinar si el movimiento suma o resta stock
$es_entrada = in_array($tipo, ['COMPRA','AJUSTE_POS','DEV_VENTA'], true);
$es_salida  = in_array($tipo, ['VENTA','AJUSTE_NEG','DEV_COMPRA'], true);

// Reglas de campos monetarios
if ($es_entrada && ($costo_u === null || $costo_u < 0)) {
  http_response_code(422); echo json_encode(['error'=>'costo_unitario requerido en entradas']); exit;
}
if ($es_salida && ($precio_u === null || $precio_u < 0)) {
  http_response_code(422); echo json_encode(['error'=>'precio_unitario requerido en salidas']); exit;
}

// Chequear stock suficiente para salidas
if ($es_salida) {
  $st = $pdo->prepare("SELECT COALESCE(SUM(cantidad),0) AS stock FROM movimientos WHERE producto_id=:pid");
  $st->execute([':pid'=>$producto_id]);
  $stock_actual = (int)$st->fetch()['stock'];
  if ($stock_actual < $cantidad) {
    http_response_code(409);
    echo json_encode(['error'=>'Stock insuficiente', 'stock_actual'=>$stock_actual, 'intentado'=>$cantidad]);
    exit;
  }
}

// Cantidad final (positiva para entradas, negativa para salidas)
$cant_final = $es_entrada ? $cantidad : -$cantidad;

try {
  $pdo->beginTransaction();

  $sql = "INSERT INTO movimientos
          (producto_id, fecha, tipo, cantidad, costo_unitario, precio_unitario, referencia, nota)
          VALUES (:pid, NOW(), :tipo, :cant, :costo, :precio, :ref, :nota)";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ':pid'   => $producto_id,
    ':tipo'  => $tipo,
    ':cant'  => $cant_final,
    ':costo' => $costo_u,
    ':precio'=> $precio_u,
    ':ref'   => $referencia !== '' ? $referencia : null,
    ':nota'  => $nota !== '' ? $nota : null,
  ]);

  // Devolver stock actualizado
  $st = $pdo->prepare("SELECT COALESCE(SUM(cantidad),0) AS stock FROM movimientos WHERE producto_id=:pid");
  $st->execute([':pid'=>$producto_id]);
  $stock_nuevo = (int)$st->fetch()['stock'];

  $pdo->commit();

  echo json_encode([
    'ok' => true,
    'movimiento_id' => $pdo->lastInsertId(),
    'producto_id' => $producto_id,
    'tipo' => $tipo,
    'cantidad_aplicada' => $cant_final,
    'stock_nuevo' => $stock_nuevo
  ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['error'=>'No se pudo registrar el movimiento','detail'=>$e->getMessage()]);
}
