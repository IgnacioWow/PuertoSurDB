// Guard de sesión + pintar usuario/rol
(async ()=>{
  try {
    const r = await fetch("/PuertoSurDB/api/auth/me.php");
    if (!r.ok) throw new Error();
    const me = await r.json();
    window.__ME__ = me; // {id, nombre, email, rol}

    // Muestra "Nombre (rol)" en el navbar si existe el span
    const el = document.getElementById("userInfo");
    if (el) el.textContent = `${me.nombre} (${me.rol})`;
  } catch {
    window.location.href = "login.html";
  }
})();

const BASE = "/PuertoSurDB";
const $ = (id) => document.getElementById(id);

const TIPO_ENTRADA = new Set(["COMPRA","AJUSTE_POS","DEV_VENTA"]);
const TIPO_SALIDA  = new Set(["VENTA","AJUSTE_NEG","DEV_COMPRA"]);

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function cargarProductos() {
  const data = await fetchJSON(`${BASE}/api/productos/list.php?limit=500&offset=0`);
  const sel = $("producto_id");
  sel.innerHTML = "";
  (data.items || []).forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.sku} — ${p.nombre}`;
    opt.dataset.stock = p.stock ?? 0;
    sel.appendChild(opt);
  });
  actualizarStockInfo();
  cargarMovimientosProducto();
}

function actualizarStockInfo() {
  const sel = $("producto_id");
  const stock = sel.options[sel.selectedIndex]?.dataset.stock ?? "0";
  $("stockInfo").textContent = `Stock actual: ${stock}`;
}

function toggleCamposMonetarios() {
  const t = $("tipo").value;
  // entradas: costo requerido, salidas: precio requerido
  $("grpCosto").style.display  = TIPO_ENTRADA.has(t) ? "" : "none";
  $("grpPrecio").style.display = TIPO_SALIDA.has(t)  ? "" : "none";
}

async function cargarMovimientosProducto() {
  const pid = $("producto_id").value;
  if (!pid) return;
  const rows = await fetchJSON(`${BASE}/api/movimientos/list.php?producto_id=${pid}`);
  const tbody = $("tbodyMovs");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Sin movimientos.</td></tr>`;
    return;
  }

  rows.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.fecha?.replace("T"," ").slice(0,19) ?? ""}</td>
      <td>${m.tipo}</td>
      <td class="text-end">${m.cantidad}</td>
      <td class="text-end">${m.costo_unitario!=null ? Number(m.costo_unitario).toLocaleString('es-CL') : "-"}</td>
      <td class="text-end">${m.precio_unitario!=null ? Number(m.precio_unitario).toLocaleString('es-CL') : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function enviarMovimiento(e) {
  e.preventDefault();
  $("msg").textContent = "";
  const pid = Number($("producto_id").value);
  const tipo = $("tipo").value;
  const cantidad = Number($("cantidad").value);
  const costo_unitario  = $("costo_unitario").value ? Number($("costo_unitario").value) : null;
  const precio_unitario = $("precio_unitario").value ? Number($("precio_unitario").value) : null;
  const referencia = $("referencia").value.trim();
  const nota = $("nota").value.trim();

  // Validación mínima
  if (!pid || !tipo || !cantidad || cantidad <= 0) {
    $("msg").textContent = "Completa producto, tipo y cantidad (>0).";
    $("msg").className = "mt-3 small text-danger";
    return;
  }
  if (TIPO_ENTRADA.has(tipo) && (costo_unitario==null || costo_unitario<0)) {
    $("msg").textContent = "costo_unitario es requerido para entradas.";
    $("msg").className = "mt-3 small text-danger";
    return;
  }
  if (TIPO_SALIDA.has(tipo) && (precio_unitario==null || precio_unitario<0)) {
    $("msg").textContent = "precio_unitario es requerido para salidas.";
    $("msg").className = "mt-3 small text-danger";
    return;
  }

  // POST
  try {
    const body = {
      producto_id: pid, tipo, cantidad,
      costo_unitario, precio_unitario,
      referencia: referencia || undefined,
      nota: nota || undefined
    };

    const resp = await fetchJSON(`${BASE}/api/movimientos/create.php`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });

    $("msg").textContent = `OK: mov #${resp.movimiento_id}, stock nuevo ${resp.stock_nuevo}`;
    $("msg").className = "mt-3 small text-success";

    // refrescar stock en combo y lista
    await cargarProductos(); // repuebla con stock actualizado
    $("producto_id").value = String(pid); // mantiene selección
    actualizarStockInfo();
    await cargarMovimientosProducto();

    $("formMov").reset();
    toggleCamposMonetarios();
  } catch (err) {
    $("msg").textContent = "Error al registrar movimiento (revisa stock o datos).";
    $("msg").className = "mt-3 small text-danger";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarProductos();
  toggleCamposMonetarios();
  $("producto_id").addEventListener("change", () => { actualizarStockInfo(); cargarMovimientosProducto(); });
  $("tipo").addEventListener("change", toggleCamposMonetarios);
  $("formMov").addEventListener("submit", enviarMovimiento);
});
