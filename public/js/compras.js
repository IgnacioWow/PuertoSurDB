// guard sesión + navbar
(async ()=>{
  try{
    const r=await fetch("/PuertoSurDB/api/auth/me.php");
    if(!r.ok) throw 0;
    const me=await r.json();
    document.getElementById("userInfo").textContent=`${me.nombre} (${me.rol})`;
  }catch{ location.href="login.html"; }
})();

const BASE="/PuertoSurDB";
const $=id=>document.getElementById(id);
async function fetchJSON(u,o){const r=await fetch(u,o); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();}
function fmt(n){return Number(n||0).toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});}
function setMsg(t,ok=true){const m=$("msg");m.textContent=t;m.className=`mt-3 small ${ok?'text-success':'text-danger'}`;}

let compraId=null;

// cargar catálogos
async function cargarProveedores(){
  const arr=await fetchJSON(`${BASE}/api/proveedores/list.php`);
  const sel=$("proveedor_id"); sel.innerHTML="";
  arr.forEach(x=>{ const o=document.createElement("option"); o.value=x.id; o.textContent=x.nombre; sel.appendChild(o); });
}
async function cargarProductos(){
  const data=await fetchJSON(`${BASE}/api/productos/list.php?estado=activos`);
  const sel=$("producto_id"); sel.innerHTML="";
  (data.items||[]).forEach(p=>{ const o=document.createElement("option"); o.value=p.id; o.textContent=`${p.sku} — ${p.nombre}`; sel.appendChild(o); });
}

// crear cabecera
async function nuevaCompra(){
  const proveedor_id=Number($("proveedor_id").value);
  const fecha=$("fecha").value || new Date().toISOString().slice(0,16).replace('T',' ');
  const num_doc=$("num_doc").value.trim();
  const r=await fetchJSON(`${BASE}/api/compras/create.php`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({proveedor_id,fecha,num_doc})
  });
  compraId=r.id;
  $("btnConfirmar").disabled=false;
  setMsg(`Compra #${compraId} creada. Agrega ítems y confirma.`);
  await refrescar();
}

// agregar ítem
async function addItem(){
  if(!compraId){ setMsg("Primero crea la compra.",false); return; }
  const payload={
    compra_id:compraId,
    producto_id:Number($("producto_id").value),
    cantidad:Number($("cantidad").value),
    costo_unitario:Number($("costo_unitario").value)
  };
  await fetchJSON(`${BASE}/api/compras/add_item.php`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  await refrescar();
}

// quitar ítem
async function removeItem(pid){
  if(!compraId) return;
  await fetchJSON(`${BASE}/api/compras/remove_item.php?compra_id=${compraId}&producto_id=${pid}`);
  await refrescar();
}

// obtener detalle + totales
async function refrescar(){
  if(!compraId) return;
  const d=await fetchJSON(`${BASE}/api/compras/get.php?id=${compraId}`);
  // items
  const tbody=$("tbody"); tbody.innerHTML="";
  (d.items||[]).forEach(it=>{
    const tr=document.createElement("tr");
    const imp=it.cantidad*it.costo_unitario;
    tr.innerHTML=`
      <td>${it.sku}</td>
      <td>${it.nombre}</td>
      <td class="text-end">${it.cantidad}</td>
      <td class="text-end">${it.costo_unitario}</td>
      <td class="text-end">${imp.toFixed(2)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger">Quitar</button>
      </td>`;
    tr.querySelector("button").addEventListener("click",()=>removeItem(it.producto_id));
    tbody.appendChild(tr);
  });
  // totales
  $("t_subtotal").textContent=fmt(d.subtotal);
  $("t_iva").textContent=fmt(d.iva);
  $("t_total").textContent=fmt(d.total);
}

// confirmar (graba totales y genera movimientos)
async function confirmar(){
  if(!compraId){ setMsg("No hay compra.",false); return; }
  const fd=new FormData(); fd.append('id',compraId);
  const r=await fetchJSON(`${BASE}/api/compras/confirm.php`,{ method:"POST", body:fd });
  setMsg(`Compra confirmada. Total: ${fmt(r.total)}`);
  await listarCompras();
  compraId=null;
  $("btnConfirmar").disabled=true;
  $("tbody").innerHTML="";
  $("t_subtotal").textContent=fmt(0);
  $("t_iva").textContent=fmt(0);
  $("t_total").textContent=fmt(0);
}

// listado de compras
async function listarCompras(q=""){
  let url=`${BASE}/api/compras/list.php`;
  if(q) url+=`?q=${encodeURIComponent(q)}`;
  const d=await fetchJSON(url);
  const tb=$("tbodyCompras"); tb.innerHTML="";
  (d.items||[]).forEach(x=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${x.id}</td>
      <td>${x.fecha}</td>
      <td>${x.proveedor}</td>
      <td>${x.num_doc??""}</td>
      <td class="text-end">${fmt(x.subtotal)}</td>
      <td class="text-end">${fmt(x.iva)}</td>
      <td class="text-end">${fmt(x.total)}</td>`;
    tb.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  await cargarProveedores();
  await cargarProductos();
  await listarCompras();

  // fecha default
  $("fecha").value = new Date().toISOString().slice(0,16);

  $("btnNueva").addEventListener("click", nuevaCompra);
  $("btnAddItem").addEventListener("click", addItem);
  $("btnConfirmar").addEventListener("click", confirmar);
  $("btnBuscar").addEventListener("click", ()=> listarCompras($("q").value.trim()));
});
