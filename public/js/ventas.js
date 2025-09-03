// =====================================================
// COMPRAS.JS — Cabecera + Detalle + Confirmación + Historial (Anular/Imprimir)
// =====================================================

// ---------------- Guard de sesión + pintar usuario/rol ----------------
(async ()=>{
  try{
    const r = await fetch("/PuertoSurDB/api/auth/me.php");
    if(!r.ok) throw 0;
    const me = await r.json();
    window.__ME__ = me; // cacheamos el rol para permisos en UI
    const el = document.getElementById("userInfo");
    if (el) el.textContent = `${me.nombre} (${me.rol})`;
  }catch{
    location.href = "login.html";
  }
})();

// ---------------- Utilidades básicas ----------------
const BASE = "/PuertoSurDB";
const $ = (id) => document.getElementById(id);
async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
function fmt(n){
  return Number(n||0).toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
}
function setMsg(text, ok=true){
  const m = $("msg");
  if(!m) return;
  m.textContent = text;
  m.className = `mt-3 small ${ok?'text-success':'text-danger'}`;
}

// ---------------- Estado local ----------------
let compraId = null; // id de la compra en edición

// ---------------- Catálogos ----------------
async function cargarProveedores(){
  const arr = await fetchJSON(`${BASE}/api/proveedores/list.php`);
  const sel = $("proveedor_id"); sel.innerHTML = "";
  arr.forEach(x=>{
    const o = document.createElement("option");
    o.value = x.id; o.textContent = x.nombre;
    sel.appendChild(o);
  });
}
async function cargarProductos(){
  const data = await fetchJSON(`${BASE}/api/productos/list.php?estado=activos`);
  const sel = $("producto_id"); sel.innerHTML = "";
  (data.items||[]).forEach(p=>{
    const o=document.createElement("option");
    o.value=p.id; o.textContent=`${p.sku} — ${p.nombre}`;
    sel.appendChild(o);
  });
}

// ---------------- Cabecera: crear nueva compra ----------------
async function nuevaCompra(){
  const proveedor_id = Number($("proveedor_id").value);
  const fecha = $("fecha").value || new Date().toISOString().slice(0,16).replace('T',' ');
  const num_doc = $("num_doc").value.trim();

  const r = await fetchJSON(`${BASE}/api/compras/create.php`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ proveedor_id, fecha, num_doc })
  });

  compraId = r.id;
  $("btnConfirmar").disabled = false;
  setMsg(`Compra #${compraId} creada. Agrega ítems y confirma.`);
  await refrescar();
}

// ---------------- Detalle: agregar y quitar ítems ----------------
async function addItem(){
  if(!compraId){ setMsg("Primero crea la compra.", false); return; }
  const payload = {
    compra_id: compraId,
    producto_id: Number($("producto_id").value),
    cantidad: Number($("cantidad").value),
    costo_unitario: Number($("costo_unitario").value)
  };
  await fetchJSON(`${BASE}/api/compras/add_item.php`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  await refrescar();
}
async function removeItem(pid){
  if(!compraId) return;
  await fetchJSON(`${BASE}/api/compras/remove_item.php?compra_id=${compraId}&producto_id=${pid}`);
  await refrescar();
}

// ---------------- Refrescar detalle + totales de la compra vigente ----------------
async function refrescar(){
  if(!compraId) return;
  const d = await fetchJSON(`${BASE}/api/compras/get.php?id=${compraId}`);

  // pintar ítems
  const tbody = $("tbody"); tbody.innerHTML="";
  (d.items||[]).forEach(it=>{
    const tr = document.createElement("tr");
    const imp = it.cantidad * it.costo_unitario;
    tr.innerHTML = `
      <td>${it.sku}</td>
      <td>${it.nombre}</td>
      <td class="text-end">${it.cantidad}</td>
      <td class="text-end">${it.costo_unitario}</td>
      <td class="text-end">${imp.toFixed(2)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger">Quitar</button>
      </td>`;
    tr.querySelector("button").addEventListener("click", ()=> removeItem(it.producto_id));
    tbody.appendChild(tr);
  });

  // totales
  $("t_subtotal").textContent = fmt(d.subtotal);
  $("t_iva").textContent      = fmt(d.iva);
  $("t_total").textContent    = fmt(d.total);
}

// ---------------- Confirmar compra: graba totales + genera movimientos ----------------
async function confirmar(){
  if(!compraId){ setMsg("No hay compra.", false); return; }
  const fd = new FormData(); fd.append('id', compraId);
  const r  = await fetchJSON(`${BASE}/api/compras/confirm.php`, { method:"POST", body: fd });
  setMsg(`Compra confirmada. Total: ${fmt(r.total)}`);

  // refrescar historial y limpiar panel
  await listarCompras();
  compraId = null;
  $("btnConfirmar").disabled = true;
  $("tbody").innerHTML = "";
  ["t_subtotal","t_iva","t_total"].forEach(id=> $(id).textContent = fmt(0));
}

// ---------------- Historial: listar, imprimir y anular ----------------
async function listarCompras(q=""){
  let url = `${BASE}/api/compras/list.php`;
  if(q) url += `?q=${encodeURIComponent(q)}`;

  const d  = await fetchJSON(url);
  const tb = $("tbodyCompras"); tb.innerHTML = "";

  const isAdmin = (window.__ME__?.rol === "admin");

  (d.items||[]).forEach(x=>{
    const tr = document.createElement("tr");
    const anulada = Number(x.anulada) === 1;

    tr.innerHTML = `
      <td>${x.id}</td>
      <td>${x.fecha}</td>
      <td>${x.proveedor}</td>
      <td>${x.num_doc ?? ""}</td>
      <td class="text-end">${fmt(x.subtotal)}</td>
      <td class="text-end">${fmt(x.iva)}</td>
      <td class="text-end">${fmt(x.total)}</td>
      <td class="text-end"></td>
    `;

    // Acciones: Imprimir siempre / Anular solo admin y no anulada
    const accionesHtml = `
      <div class="btn-group btn-group-sm">
        <a class="btn btn-outline-secondary" href="${BASE}/api/compras/print.php?id=${x.id}" target="_blank">Imprimir</a>
        ${
          (isAdmin && !anulada)
            ? `<button class="btn btn-outline-danger" data-id="${x.id}">Anular</button>`
            : (anulada ? '<span class="badge bg-secondary align-self-center">Anulada</span>' : '')
        }
      </div>`;
    tr.querySelector("td:last-child").innerHTML = accionesHtml;

    // Handler de anulación (si corresponde)
    const btn = tr.querySelector("button");
    if (btn){
      btn.addEventListener("click", async ()=>{
        if(!confirm("¿Anular compra y revertir stock?")) return;
        btn.disabled = true;
        try{
          const fd = new FormData(); fd.append('id', btn.dataset.id);
          const r  = await fetch(`${BASE}/api/compras/void.php`, { method:"POST", body:fd });
          if(!r.ok) throw new Error(await r.text());
          await listarCompras($("q").value.trim());
        }catch(e){
          alert("No se pudo anular: " + (e.message || e));
          btn.disabled = false;
        }
      });
    }

    tb.appendChild(tr);
  });
}

// ---------------- Boot de la pantalla ----------------
document.addEventListener("DOMContentLoaded", async ()=>{
  // catálogos + historial
  await cargarProveedores();
  await cargarProductos();
  await listarCompras();

  // fecha por defecto (ahora)
  $("fecha").value = new Date().toISOString().slice(0,16);

  // listeners de acciones
  $("btnNueva").addEventListener("click", nuevaCompra);
  $("btnAddItem").addEventListener("click", addItem);
  $("btnConfirmar").addEventListener("click", confirmar);
  $("btnBuscar").addEventListener("click", ()=> listarCompras($("q").value.trim()));
});
