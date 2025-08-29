// Guard de sesión
(async ()=>{
  try {
    const r = await fetch("/PuertoSurDB/api/auth/me.php");
    if (!r.ok) throw new Error();
    const me = await r.json();
    window.__ME__ = me; // {id, nombre, email, rol}
  } catch {
    window.location.href = "login.html";
  }
})();

const BASE = "/PuertoSurDB";

async function cargarProductos(q = "") {
  const url = q
    ? `${BASE}/api/productos/list.php?q=${encodeURIComponent(q)}`
    : `${BASE}/api/productos/list.php`;

  const res = await fetch(url);
  const data = await res.json();
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  (data.items || []).forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.sku}</td>
      <td>${row.nombre}</td>
      <td>${row.categoria ?? "-"}</td>
      <td class="text-end">${row.stock ?? 0}</td>
      <td class="text-end">$ ${Number(row.precio_venta ?? 0).toLocaleString('es-CL')}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("btnBuscar").addEventListener("click", () => {
  const q = document.getElementById("buscador").value.trim();
  cargarProductos(q);
});

document.addEventListener("DOMContentLoaded", () => cargarProductos());
