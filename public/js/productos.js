// =====================================================
// 1. CONSTANTES Y HELPERS
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
  const el = $("msg");
  if (el) {
    el.textContent = text;
    el.className = `mt-3 small ${ok ? "text-success" : "text-danger"}`;
  }
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
// 2. CARGAR CATÁLOGOS (categorías y unidades)
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
// 3. LISTAR PRODUCTOS
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
// 4. CARGAR PRODUCTO EN FORMULARIO LATERAL
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
// 5. GUARDAR PRODUCTO (Lateral y Modal)
// =====================================================
// Lógica compartida para guardar (se usa en lateral y modal)
async function procesarGuardado(payload, esModal = false) {
    try {
        let url = payload.id ? `${BASE}/api/productos/update.php` : `${BASE}/api/productos/create.php`;
        
        const resp = await fetchJSON(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });

        if (!esModal) {
             if (!payload.id) { $("id").value = resp.id; $("btnEliminar").disabled = false; }
             setMsg(payload.id ? "Actualizado correctamente." : "Creado correctamente.");
        }
        return true; // Éxito
    } catch {
        if (!esModal) setMsg("Error al guardar (revisa datos/SKU único).", false);
        else alert("Error al guardar. Revisa que el SKU no esté repetido.");
        return false; // Fallo
    }
}

// Guardar desde Formulario Lateral
async function guardar(e) {
  e.preventDefault();
  const id = $("id").value.trim();
  const body = {
    id: id ? Number(id) : null,
    sku: $("sku").value.trim(),
    nombre: $("nombre").value.trim(),
    categoria_id: Number($("categoria_id").value),
    unidad_id: Number($("unidad_id").value),
    precio_compra: Number($("precio_compra").value),
    precio_venta: Number($("precio_venta").value),
    stock_minimo: Number($("stock_minimo").value),
    activo: Number($("activo").value)
  };
  
  const ok = await procesarGuardado(body, false);
  if(ok) await listar($("q").value.trim());
}

// =====================================================
// 6. ELIMINAR (Lógico)
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
// 7. MODAL: CREAR/EDITAR Y CONTROL DEL LECTOR
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
  
  // FOCO AUTOMÁTICO AL SKU (Retraso para esperar animación)
  setTimeout(() => $("m_sku").focus(), 500);
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

// Submit del Modal
async function onSubmitModal(e) {
  e.preventDefault();
  const id = $("m_id").value.trim();
  const payload = {
    id: id ? Number(id) : null,
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

  const ok = await procesarGuardado(payload, true);
  if (ok) {
      modal.hide();
      await listar($("q").value.trim());
  }
}

// =====================================================
// 8. CONFIGURACIÓN DEL ESCÁNER (LECTOR DE BARRAS)
// =====================================================
// Esta función detecta el "Enter" que envía el lector y salta al siguiente campo
function setupScanner(inputId, nextInputId) {
    const input = $(inputId);
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // Evita submit del form
                // Si hay algo escrito, saltamos al nombre
                if (e.target.value.trim() !== "") {
                    const next = $(nextInputId);
                    if (next) next.focus();
                }
            }
        });
    }
}

// =====================================================
// 9. INICIALIZACIÓN DE LA PÁGINA
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar modal Bootstrap
  const modalEl = document.getElementById("modalProducto");
  if (modalEl) {
    modal = new bootstrap.Modal(modalEl);
    formModal = document.getElementById("formProducto");
    modalTitulo = document.getElementById("modalTitulo");
    formModal.addEventListener("submit", onSubmitModal);
  }

  // Cargar datos iniciales
  await cargarCatalogos();
  await listar();

  // Eventos Buscador
  $("btnBuscar").addEventListener("click", () => listar($("q").value.trim()));
  $("f_estado").addEventListener("change", () => listar($("q").value.trim()));

  // Eventos Formulario Lateral
  $("formProd").addEventListener("submit", guardar);
  $("btnEliminar").addEventListener("click", eliminar);

  // BOTÓN NUEVO: Detecta si es escritorio o móvil para foco o modal
  $("btnNuevo").addEventListener("click", () => {
      // Si la pantalla es grande (Desktop), usamos el form lateral
      if (window.innerWidth >= 992) {
          limpiarForm();
          $("sku").focus(); // Foco directo para escanear
      } else {
          // Si es móvil, usamos modal
          openCreateModal();
      }
  });

  // ACTIVAR ESCÁNER (Para lateral y modal)
  setupScanner("sku", "nombre");      // Lateral
  setupScanner("m_sku", "m_nombre");  // Modal

  // Botones CSV
  $("btnCSVProductos").addEventListener("click", () => window.open(`${BASE}/api/export/productos_csv.php`, "_blank"));
  $("btnCSVMovs").addEventListener("click", () => window.open(`${BASE}/api/export/movimientos_csv.php`, "_blank"));
  $("btnCSVValorizado").addEventListener("click", () => window.open(`${BASE}/api/export/valorizado_csv.php`, "_blank"));

  // Botón Eliminar en el Modal (Solo Admin)
  const btnDelModal = document.getElementById("m_btnEliminar");
  if (btnDelModal && window.__ME__?.rol === 'admin') {
    btnDelModal.classList.remove('d-none');
    btnDelModal.addEventListener('click', async () => {
      const id = $("m_id").value.trim();
      if (!id || !confirm("¿Eliminar este producto?")) return;
      await fetchJSON(`${BASE}/api/productos/delete.php?id=${id}`);
      modal.hide();
      await listar($("q").value.trim());
      setMsg("Eliminado lógicamente.");
    });
  }
  
  // Filtros Admin
  const selEstado = document.getElementById("f_estado");
  if (selEstado && window.__ME__?.rol !== 'admin') {
    [...selEstado.options].forEach(opt => {
      if (opt.value === 'eliminados' || opt.value === 'todos') opt.remove();
    });
  }
});