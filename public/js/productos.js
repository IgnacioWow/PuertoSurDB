// =====================================================
// 1. VERIFICAR SESIÓN Y MOSTRAR USUARIO
// =====================================================
(async ()=>{
  try {
    const r = await fetch("/PuertoSurDB/api/auth/me.php");
    if (!r.ok) throw new Error();
    const me = await r.json();
    window.__ME__ = me; // Guardamos usuario {id, nombre, email, rol}

    // Mostrar "Nombre (rol)" en el navbar
    const el = document.getElementById("userInfo");
    if (el) el.textContent = `${me.nombre} (${me.rol})`;
  } catch {
    // Si no está autenticado → redirige al login
    location.href = "login.html";
  }
})();

// =====================================================
// 2. FUNCIONES AUXILIARES
// =====================================================
const BASE = "/PuertoSurDB";
const $ = (id) => document.getElementById(id);

// Hacer fetch y parsear JSON
async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Mostrar mensajes en el formulario lateral
function setMsg(text, ok = true) {
  $("msg").textContent = text;
  $("msg").className = `mt-3 small ${ok ? "text-success" : "text-danger"}`;
}

// Limpiar el formulario lateral
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

// =====================================================
// 3. CARGAR CATÁLOGOS (categorías y unidades)
// =====================================================
async function cargarCatalogos() {
  const [cats, unis] = await Promise.all([
    fetchJSON(`${BASE}/api/catalogos/categorias.php`),
    fetchJSON(`${BASE}/api/catalogos/unidades.php`)
  ]);

  // Función para llenar select con opciones
  const fill = (sel, arr, map) => {
    if (!sel) return;
    sel.innerHTML = "";
    arr.forEach(x => {
      const o = document.createElement("option");
      o.value = map.value(x);
      o.textContent = map.text(x);
      sel.appendChild(o);
    });
  };

  // Selects del formulario lateral
  fill($("categoria_id"), cats, { value: c => c.id, text: c => c.nombre });
  fill($("unidad_id"), unis, { value: u => u.id, text: u => `${u.nombre} (${u.abreviatura})` });

  // Selects del modal
  fill($("m_categoria_id"), cats, { value: c => c.id, text: c => c.nombre });
  fill($("m_unidad_id"), unis, { value: u => u.id, text: u => `${u.nombre} (${u.abreviatura})` });
}

// =====================================================
// 4. LISTAR PRODUCTOS
// =====================================================
async function listar(q = "") {
  const estado = document.getElementById("f_estado")?.value || "activos";
  let url = `${BASE}/api/productos/list.php?estado=${encodeURIComponent(estado)}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;

  const data = await fetchJSON(url);
  const tbody = $("tbody");
  tbody.innerHTML = "";

  (data.items || []).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.sku}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria ?? "-"}</td>
      <td class="text-end">${p.stock ?? 0}</td>
      <td class="text-end">$ ${Number(p.precio_venta ?? 0).toLocaleString('es-CL')}</td>
    `;

    // Botón editar
    const tdAcc = document.createElement("td");
    tdAcc.className = "text-end";
    const btnE = document.createElement("button");
    btnE.className = "btn btn-sm btn-outline-primary";
    btnE.textContent = "Editar";
    btnE.addEventListener("click", (ev) => { 
      ev.stopPropagation();
      openEditModal(p.id);
    });
    tdAcc.appendChild(btnE);
    tr.appendChild(tdAcc);

    // Al hacer clic en la fila → cargar en el formulario lateral
    tr.addEventListener("click", () => cargarEnFormulario(p.id));
    tbody.appendChild(tr);
  });
}

// =====================================================
// 5. CARGAR PRODUCTO EN FORMULARIO LATERAL
// =====================================================
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

// =====================================================
// 6. GUARDAR PRODUCTO (formulario lateral)
// =====================================================
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
      await fetchJSON(`${BASE}/api/productos/update.php`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id: Number(id), ...body })
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
  } catch {
    setMsg("Error al guardar. Revisa datos (SKU único).", false);
  }
}

// =====================================================
// 7. ELIMINAR (formulario lateral)
// =====================================================
async function eliminar() {
  const id = $("id").value.trim();
  if (!id) return;
  if (!confirm("¿Eliminar (lógico) este producto?")) return;
  try {
    await fetchJSON(`${BASE}/api/productos/delete.php?id=${id}`);
    limpiarForm();
    await listar($("q").value.trim());
    setMsg("Eliminado lógicamente.");
  } catch {
    setMsg("Error al eliminar.", false);
  }
}

// =====================================================
// 8. MODAL: CREAR/EDITAR PRODUCTOS
// =====================================================
let modal, formModal, modalTitulo;

// Abrir modal vacío (crear)
function openCreateModal() {
  if (!formModal) return;
  modalTitulo.textContent = "Nuevo producto";
  formModal.reset();
  $("m_id").value = "";
  $("m_activo").value = "1";
  $("m_stock_minimo").value = "0";
  modal.show();
}

// Abrir modal cargando datos (editar)
async function openEditModal(id) {
  if (!formModal) return;
  const p = await fetchJSON(`${BASE}/api/productos/get.php?id=${id}`);
  modalTitulo.textContent = "Editar producto";
  $("m_id").value = p.id ?? "";
  $("m_sku").value = p.sku ?? "";
  $("m_nombre").value = p.nombre ?? "";
  $("m_categoria_id").value = p.categoria_id ?? "";
  $("m_unidad_id").value = p.unidad_id ?? "";
  $("m_precio_compra").value = p.precio_compra ?? 0;
  $("m_precio_venta").value = p.precio_venta ?? 0;
  $("m_stock_minimo").value = p.stock_minimo ?? 0;
  $("m_activo").value = (p.activo ?? 1).toString();
  $("m_descripcion").value = p.descripcion ?? "";
  modal.show();
}

// Guardar desde modal
async function onSubmitModal(e) {
  e.preventDefault();
  const id = $("m_id").value.trim();
  const payload = {
    sku: $("m_sku").value.trim(),
    nombre: $("m_nombre").value.trim(),
    categoria_id: Number($("m_categoria_id").value),
    unidad_id: Number($("m_unidad_id").value),
    precio_compra: Number($("m_precio_compra").value || 0),
    precio_venta: Number($("m_precio_venta").value || 0),
    stock_minimo: Number($("m_stock_minimo").value || 0),
    activo: Number($("m_activo").value || 1),
    descripcion: $("m_descripcion").value.trim()
  };

  try {
    if (id) {
      await fetchJSON(`${BASE}/api/productos/update.php`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id: Number(id), ...payload })
      });
      setMsg("Actualizado correctamente.");
    } else {
      await fetchJSON(`${BASE}/api/productos/create.php`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      setMsg("Creado correctamente.");
    }
    modal.hide();
    await listar($("q").value.trim());
  } catch {
    setMsg("Error al guardar (revisa datos/SKU único).", false);
  }
}

// =====================================================
// 9. INICIALIZACIÓN DE LA PÁGINA
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar modal
  const modalEl = document.getElementById("modalProducto");
  if (modalEl) {
    modal = new bootstrap.Modal(modalEl);
    formModal = document.getElementById("formProducto");
    modalTitulo = document.getElementById("modalTitulo");
    formModal.addEventListener("submit", onSubmitModal);
  }

  // Cargar catálogos y lista inicial
  await cargarCatalogos();
  await listar();

  // Eventos del buscador y botones CSV
  $("btnBuscar").addEventListener("click", () => listar($("q").value.trim()));
  $("f_estado").addEventListener("change", () => listar($("q").value.trim()));

  // Eventos del formulario lateral
  $("formProd").addEventListener("submit", guardar);
  $("btnNuevo").addEventListener("click", openCreateModal);
  $("btnEliminar").addEventListener("click", eliminar);

  // Botones CSV
  $("btnCSVProductos").addEventListener("click", () => {
    window.open(`${BASE}/api/export/productos_csv.php`, "_blank");
  });
  $("btnCSVMovs").addEventListener("click", () => {
    window.open(`${BASE}/api/export/movimientos_csv.php`, "_blank");
  });
  $("btnCSVValorizado").addEventListener("click", () => {
    window.open(`${BASE}/api/export/valorizado_csv.php`, "_blank");
  });

  // =====================================================
  // 10. BOTÓN ELIMINAR EN EL MODAL (SOLO ADMIN)
  // =====================================================
  const btnDel = document.getElementById("m_btnEliminar");
  if (btnDel && window.__ME__?.rol === 'admin') {
    btnDel.classList.remove('d-none');
    btnDel.addEventListener('click', async () => {
      const id = $("m_id").value.trim();
      if (!id) return;
      if (!confirm("¿Eliminar este producto?")) return;
      await fetchJSON(`${BASE}/api/productos/delete.php?id=${id}`);
      modal.hide();
      await listar($("q").value.trim());
      setMsg("Eliminado lógicamente.");
    });
  }
});
