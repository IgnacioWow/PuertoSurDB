<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$q=trim($_GET['q']??'');
$w=""; $p=[];
if($q!==''){ $w="WHERE (c.num_doc LIKE ? OR p.nombre LIKE ?)"; $like="%$q%"; $p=[$like,$like]; }
$sql="SELECT c.id,c.fecha,c.num_doc,c.subtotal,c.iva,c.total,p.nombre proveedor
      FROM compras c JOIN proveedores p ON p.id=c.proveedor_id
      $w ORDER BY c.id DESC LIMIT 200";
$st=$pdo->prepare($sql); $st->execute($p);
echo json_encode(['ok'=>true,'items'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
