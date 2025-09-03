// Guard de sesión + navbar
(async ()=>{
  try {
    const r = await fetch("/PuertoSurDB/api/auth/me.php");
    if (!r.ok) throw new Error();
    const me = await r.json();
    const el = document.getElementById("userInfo");
    if (el) el.textContent = `${me.nombre} (${me.rol})`;
  } catch { location.href = "login.html"; }
})();

const BASE="/PuertoSurDB";
const $=id=>document.getElementById(id);
async function fetchJSON(u,o){const r=await fetch(u,o); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();}
function setMsg(t,ok=true){const m=$("msg"); if(m){m.textContent=t; m.className=`mt-3 small ${ok?'text-success':'text-danger'}`;}}

let modal, form;

// Cargar productos en select
async function cargarProductos() {
  const data = await fetchJSON(`${BASE}/api/productos/list.php?estado=activos`);
  const sel = $("producto_id"); sel.innerHTML="";
  (data.items||[]).forEach(p=>{
    const o=document.createElement("option");
    o.value=p.id; o.textContent=`${p.sku} — ${p.nombre}`;
    sel.appendChild(o);
  });
}

// Listado
async function listar(q="") {
  let url = `${BASE}/api/movimientos/list.php`;
  if(q) url += `?q=${encodeURIComponent(q)}`;
  const data = await fetchJSON(url);
  const tbody = $("tbody"); tbody.innerHTML="";
  (data.items||[]).forEach(m=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${m.fecha}</td>
      <td>${m.sku}</td>
      <td>${m.nombre}</td>
      <td>${m.tipo}</td>
      <td class="text-end">${m.cantidad}</td>
      <td class="text-end">${m.costo_unitario??""}</td>
      <td class="text-end">${m.precio_unitario??""}</td>
      <td>${m.referencia??""}</td>`;
    tbody.appendChild(tr);
  });
}

// Submit modal
async function onSubmit(e){
  e.preventDefault();
  const payload = {
    producto_id: Number($("producto_id").value),
    tipo: $("tipo").value,
    cantidad: Number($("cantidad").value),
    costo_unitario: $("costo_unitario").value? Number($("costo_unitario").value): null,
    precio_unitario: $("precio_unitario").value? Number($("precio_unitario").value): null,
    referencia: $("referencia").value.trim(),
    nota: $("nota").value.trim()
  };
  try{
    await fetchJSON(`${BASE}/api/movimientos/create.php`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    setMsg("Movimiento registrado.");
    modal.hide();
    await listar($("q").value.trim());
  }catch(e){
    setMsg("Error al registrar movimiento.", false);
  }
}

document.addEventListener("DOMContentLoaded", async ()=>{
  modal = new bootstrap.Modal(document.getElementById("modalMov"));
  form = $("formMov"); form.addEventListener("submit", onSubmit);

  await cargarProductos();
  await listar();

  $("btnBuscar").addEventListener("click", ()=> listar($("q").value.trim()));
  $("btnNuevoMov").addEventListener("click", ()=> { $("formMov").reset(); setMsg(""); modal.show(); });
});
