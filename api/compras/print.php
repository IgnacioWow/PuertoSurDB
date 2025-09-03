<?php
// /PuertoSurDB/api/compras/print.php?id=123[&as=pdf]
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__.'/../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) { http_response_code(422); echo "ID inválido"; exit; }

// cabecera
$st=$pdo->prepare("SELECT c.*, p.nombre proveedor FROM compras c JOIN proveedores p ON p.id=c.proveedor_id WHERE c.id=?");
$st->execute([$id]); $h=$st->fetch(PDO::FETCH_ASSOC);
if(!$h){ http_response_code(404); echo "Compra no encontrada"; exit; }

// detalle
$st=$pdo->prepare("SELECT d.*, pr.sku, pr.nombre FROM compras_det d JOIN productos pr ON pr.id=d.producto_id WHERE d.compra_id=?");
$st->execute([$id]); $items=$st->fetchAll(PDO::FETCH_ASSOC);

// totales (recalc por seguridad)
$subtotal=0; foreach($items as $it) $subtotal += $it['cantidad']*$it['costo_unitario'];
$iva=round($subtotal*0.19,2); $total=round($subtotal+$iva,2);

function fmt($n){ return '$ '.number_format((float)$n,0,',','.'); }
$logoPath = __DIR__."/../../public/img/logo.png";
$logoTag  = is_file($logoPath) ? '<img src="../../public/img/logo.png" style="height:48px">' : '<strong>PuertoSurDB</strong>';

$html = <<<HTML
<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Compra #{$h['id']}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:22px;color:#222;}
  .enc{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .h1{font-size:22px;margin:0}
  .muted{color:#666}
  .box{border:1px solid #ddd;border-radius:8px;padding:12px;margin-top:10px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{padding:6px;border-bottom:1px solid #eee;font-size:13px}
  th{text-align:left;background:#f8f9fa}
  td.num{text-align:right}
  .totales{width:320px;margin-left:auto}
  .badge{display:inline-block;background:#6c757d;color:#fff;border-radius:6px;padding:2px 8px;font-size:12px}
  .anulada{position:fixed;inset:40% auto auto 10%;transform:rotate(-20deg);font-size:64px;color:#dc354550;border:6px solid #dc354560;padding:8px 16px}
  @media print {.no-print{display:none}}
</style></head><body>
<div class="enc">
  <div>$logoTag</div>
  <div style="text-align:right">
    <div class="h1">COMPRA #{$h['id']}</div>
    <div class="muted">Fecha: {$h['fecha']}</div>
    <div class="muted">N° doc: {$h['num_doc']}</div>
  </div>
</div>

<div class="box">
  <strong>Proveedor:</strong> {$h['proveedor']}
</div>

<table>
  <thead><tr>
    <th style="width:110px">SKU</th><th>Producto</th>
    <th style="width:80px" class="num">Cant</th>
    <th style="width:110px" class="num">Costo</th>
    <th style="width:120px" class="num">Importe</th>
  </tr></thead>
  <tbody>
HTML;

foreach($items as $it){
  $imp = $it['cantidad']*$it['costo_unitario'];
  $html .= "<tr>
    <td>{$it['sku']}</td>
    <td>{$it['nombre']}</td>
    <td class='num'>".$it['cantidad']."</td>
    <td class='num'>".fmt($it['costo_unitario'])."</td>
    <td class='num'>".fmt($imp)."</td>
  </tr>";
}

$html .= "</tbody></table>
<table class='totales'>
  <tr><td>SubTotal</td><td class='num'>".fmt($subtotal)."</td></tr>
  <tr><td>IVA (19%)</td><td class='num'>".fmt($iva)."</td></tr>
  <tr><td><strong>Total</strong></td><td class='num'><strong>".fmt($total)."</strong></td></tr>
</table>

<div class='muted no-print' style='margin-top:16px'>Imprime desde el navegador (Ctrl/Cmd+P) o usa <code>&as=pdf</code> si Dompdf está instalado.</div>";

if((int)$h['anulada']===1){ $html.="<div class='anulada'>ANULADA</div>"; }

$html .= "</body></html>";

// Si está Dompdf disponible y piden &as=pdf, renderiza PDF:
if (isset($_GET['as']) && $_GET['as']==='pdf' && class_exists('\\Dompdf\\Dompdf')) {
  if (file_exists(__DIR__.'/../../vendor/autoload.php')) require __DIR__.'/../../vendor/autoload.php';
  $dompdf = new Dompdf\Dompdf(['isRemoteEnabled'=>true]);
  $dompdf->loadHtml($html); $dompdf->setPaper('A4','portrait'); $dompdf->render();
  $dompdf->stream("compra-{$h['id']}.pdf", ['Attachment'=>false]); // inline
  exit;
}

echo $html;
