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

async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function setMsg(text, ok = true) {
  $("msg").textContent = text;
  $("msg").className = `mt-3 small ${ok ? "text-success" : "text-danger"}`;
}

function limpiarForm() {
  $("id").value = "";
  $("sku").value = "";
  $("nombre").value = "";
  $("precio_compra").value = "";
  $("precio_venta").value = "";
  $("stock_minimo").value = "0";
  $("activo").value = "1";
  $("btnEliminar").disabled = true;
  $("msg").textContent = "";
}

async function cargarCatalogos() {
  const [cats, unis] = await Promise.all([
    fetchJSON(`${BASE}/api/catalogos/categorias.php`),
    fetchJSON(`${BASE}/api/catalogos/unidades.php`)
  ]);

  const catSel = $("categoria_id");
  const uniSel = $("unidad_id");
  catSel.innerHTML = "";
  uniSel.innerHTML = "";

  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = c.nombre;
    catSel.appendChild(o);
  });
  unis.forEach(u => {
    const o = document.createElement("option");
    o.value = u.id; o.textContent = `${u.nombre} (${u.abreviatura})`;
    uniSel.appendChild(o);
  });
}

async function listar(q = "") {
  const url = q ? `${BASE}/api/productos/list.php?q=${encodeURIComponent(q)}` 
                : `${BASE}/api/productos/list.php`;
  const data = await fetchJSON(url);
  const tbody = $("tbody");
  tbody.innerHTML = "";

  (data.items || []).forEach(p => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.innerHTML = `
      <td>${p.sku}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria ?? "-"}</td>
      <td class="text-end">${p.stock ?? 0}</td>
      <td class="text-end">$ ${Number(p.precio_venta ?? 0).toLocaleString('es-CL')}</td>
    `;
    tr.addEventListener("click", () => cargarEnFormulario(p.id));
    tbody.appendChild(tr);
  });
}

async function cargarEnFormulario(id) {
  const p = await fetchJSON(`${BASE}/api/productos/get.php?id=${id}`);
  $("id").value = p.id;
  $("sku").value = p.sku;
  $("nombre").value = p.nombre;
  $("categoria_id").value = p.categoria_id;
  $("unidad_id").value = p.unidad_id;
  $("precio_compra").value = p.precio_compra;
  $("precio_venta").value = p.precio_venta;
  $("stock_minimo").value = p.stock_minimo ?? 0;
  $("activo").value = p.activo ?? 1;
  $("btnEliminar").disabled = false;
  setMsg("Producto cargado.", true);
}

async function guardar(e) {
  e.preventDefault();
  const id = $("id").value.trim();
  const body = {
    sku: $("sku").value.trim(),
    nombre: $("nombre").value.trim(),
    categoria_id: Number($("categoria_id").value),
    unidad_id: Number($("unidad_id").value),
    precio_compra: Number($("precio_compra").value),
    precio_venta: Number($("precio_venta").value),
    stock_minimo: Number($("stock_minimo").value),
    activo: Number($("activo").value)
  };
  try {
    if (id) {
      body.id = Number(id);
      await fetchJSON(`${BASE}/api/productos/update.php`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });
      setMsg("Actualizado correctamente.");
    } else {
      const resp = await fetchJSON(`${BASE}/api/productos/create.php`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });
      $("id").value = resp.id;
      $("btnEliminar").disabled = false;
      setMsg("Creado correctamente.");
    }
    await listar($("q").value.trim());
  } catch (e) {
    setMsg("Error al guardar. Revisa datos (SKU único).", false);
  }
}

async function eliminar() {
  const id = $("id").value.trim();
  if (!id) return;
  if (!confirm("¿Eliminar (lógico) este producto?")) return;
  try {
    await fetchJSON(`${BASE}/api/productos/delete.php?id=${id}`);
    limpiarForm();
    await listar($("q").value.trim());
    setMsg("Eliminado lógicamente.");
  } catch (e) {
    setMsg("Error al eliminar.", false);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogos();
  await listar();

  $("btnBuscar").addEventListener("click", () => listar($("q").value.trim()));
  $("formProd").addEventListener("submit", guardar);
  $("btnNuevo").addEventListener("click", limpiarForm);
  $("btnEliminar").addEventListener("click", eliminar);
});
