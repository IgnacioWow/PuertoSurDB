// =====================================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// =====================================================
const BASE = "/PuertoSurDB";
const $ = (id) => document.getElementById(id);

// Estado del "Carrito" de compra
let carrito = []; 
let page = 1; // Paginación simple

// Helper para Fetch
async function fetchJSON(url, opts) {
    const r = await fetch(url, opts);
    // Si el backend devuelve error (ej: 400 o 500), lanzamos el mensaje
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

// Helper para formatear dinero (CLP)
const fmtMoney = (n) => "$ " + Number(n).toLocaleString("es-CL");

// Mostrar mensajes
function setMsg(text, ok = true) {
    const el = $("msg");
    if(el) {
        el.textContent = text;
        el.className = `mt-3 small ${ok ? "text-success" : "text-danger"}`;
    }
}

// =====================================================
// 2. CARGAR DATOS INICIALES (Proveedores y Productos)
// =====================================================
async function cargarDatosIniciales() {
    try {
        // 1. Cargar Proveedores
        const proveedores = await fetchJSON(`${BASE}/api/proveedores/list.php`);
        const selProv = $("proveedor_id");
        selProv.innerHTML = '<option value="">-- Seleccione Proveedor --</option>';
        proveedores.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.nombre;
            selProv.appendChild(opt);
        });

        // 2. Cargar Productos (para el select del detalle)
        const resProd = await fetchJSON(`${BASE}/api/productos/list.php?estado=activos`);
        const selProd = $("producto_id");
        selProd.innerHTML = '<option value="">-- Buscar Producto --</option>';
        
        (resProd.items || []).forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            // Guardamos el costo actual en un atributo para sugerirlo al seleccionarlo
            opt.dataset.costo = p.precio_compra || 0; 
            opt.textContent = `${p.sku} - ${p.nombre}`;
            selProd.appendChild(opt);
        });

        // Sugerir fecha y hora actual
        $("fecha").value = new Date().toISOString().slice(0, 16);

    } catch (err) {
        console.error("Error cargando listas", err);
        setMsg("Error cargando datos. Asegúrate que existen proveedores y productos.", false);
    }
}

// DETALLE DE UX: Al seleccionar un producto, sugerir su último costo automáticamente
$("producto_id").addEventListener("change", (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if(opt && opt.value) {
        const costo = opt.dataset.costo || 0;
        $("costo_unitario").value = costo;
        $("cantidad").focus(); // Salto automático a cantidad
    }
});

// =====================================================
// 3. LÓGICA DEL CARRITO (Agregar/Quitar Ítems)
// =====================================================

// Agregar ítem al array 'carrito'
$("btnAddItem").addEventListener("click", () => {
    const prodSelect = $("producto_id");
    const prodId = prodSelect.value;
    const prodTexto = prodSelect.options[prodSelect.selectedIndex]?.text;
    
    const cant = Number($("cantidad").value);
    const costo = Number($("costo_unitario").value);

    if (!prodId || cant <= 0 || costo < 0) {
        alert("Selecciona un producto, cantidad > 0 y costo válido.");
        return;
    }

    // Verificar si ya está en el carrito para sumar cantidad
    const existe = carrito.find(i => i.producto_id === prodId);
    if (existe) {
        existe.cantidad += cant;
        existe.costo_unitario = costo; // Actualizamos costo al último ingresado
    } else {
        carrito.push({
            producto_id: prodId,
            nombre: prodTexto,
            cantidad: cant,
            costo_unitario: costo
        });
    }

    // Resetear campos de ingreso
    $("cantidad").value = 1;
    $("costo_unitario").value = 0;
    prodSelect.value = "";
    prodSelect.focus();

    renderCarrito();
});

// Renderizar la tabla del detalle
function renderCarrito() {
    const tbody = $("tbody");
    tbody.innerHTML = "";

    let subtotalGlobal = 0;

    carrito.forEach((item, index) => {
        const importe = item.cantidad * item.costo_unitario;
        subtotalGlobal += importe;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td class="text-end">${item.cantidad}</td>
            <td class="text-end">${fmtMoney(item.costo_unitario)}</td>
            <td class="text-end fw-bold">${fmtMoney(importe)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger py-0" onclick="quitarItem(${index})">Quitar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Cálculos (Neto + IVA 19%)
    const iva = Math.round(subtotalGlobal * 0.19);
    const total = subtotalGlobal + iva;

    $("t_subtotal").textContent = fmtMoney(subtotalGlobal);
    $("t_iva").textContent = fmtMoney(iva);
    $("t_total").textContent = fmtMoney(total);

    // Habilitar botón confirmar si hay ítems
    $("btnConfirmar").disabled = carrito.length === 0;
}

// Función global para quitar ítems
window.quitarItem = (index) => {
    carrito.splice(index, 1);
    renderCarrito();
};

// Botón "Nueva Compra" (Limpia el formulario)
$("btnNueva").addEventListener("click", () => {
    carrito = [];
    renderCarrito();
    $("proveedor_id").value = "";
    $("num_doc").value = "";
    $("fecha").value = new Date().toISOString().slice(0, 16);
    setMsg("");
    $("proveedor_id").focus();
});

// =====================================================
// 4. GUARDAR COMPRA (CONFIRMAR)
// =====================================================
$("btnConfirmar").addEventListener("click", async () => {
    if (carrito.length === 0) return;
    if (!confirm("¿Confirmar ingreso de stock?")) return;

    const payload = {
        proveedor_id: $("proveedor_id").value,
        fecha: $("fecha").value,
        numero_documento: $("num_doc").value.trim(),
        items: carrito // Enviamos el array completo
    };

    if (!payload.proveedor_id || !payload.numero_documento) {
        return alert("Falta el Proveedor o el Número de Documento.");
    }

    try {
        // Enviamos a create.php (que maneja todo en una transacción)
        await fetchJSON(`${BASE}/api/compras/create.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        setMsg("Compra guardada y stock actualizado.", true);
        
        // Limpiar todo
        carrito = [];
        renderCarrito();
        $("num_doc").value = "";
        
        // Recargar historial
        listarCompras();

    } catch (error) {
        console.error(error);
        setMsg("Error al guardar: " + (error.message || error), false);
    }
});

// =====================================================
// 5. HISTORIAL DE COMPRAS (CON IMPRIMIR Y ANULAR)
// =====================================================
async function listarCompras() {
    const q = $("q").value;
    const desde = $("f_desde").value;
    const hasta = $("f_hasta").value;
    const limit = $("per_page").value;

    // Construimos la URL con parámetros
    const params = new URLSearchParams({
        page: page,
        limit: limit,
        q: q,
        desde: desde,
        hasta: hasta
    });

    try {
        const data = await fetchJSON(`${BASE}/api/compras/list.php?${params}`);
        const tbody = $("tbodyCompras");
        tbody.innerHTML = "";
        
        const isAdmin = (window.__ME__?.rol === "admin");

        (data.items || []).forEach(c => {
            const tr = document.createElement("tr");
            // Si está anulada (estado 0), la tachamos visualmente
            const anulada = Number(c.estado) === 0 || Number(c.anulada) === 1; // Soporte para ambos nombres de columna
            
            if (anulada) tr.classList.add("text-muted", "text-decoration-line-through");

            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.fecha.substring(0,16).replace("T", " ")}</td>
                <td>${c.proveedor || c.proveedor_nombre || '-'}</td>
                <td>${c.numero_documento || c.num_doc}</td>
                <td class="text-end">${fmtMoney(c.subtotal)}</td>
                <td class="text-end">${fmtMoney(c.iva || c.impuestos)}</td>
                <td class="text-end fw-bold">${fmtMoney(c.total)}</td>
                <td class="text-end"></td>
            `;

            // COLUMNA DE ACCIONES
            const accionesHtml = `
                <div class="btn-group btn-group-sm">
                    <a class="btn btn-outline-secondary" href="${BASE}/api/compras/print.php?id=${c.id}" target="_blank">🖨️</a>
                    ${ (isAdmin && !anulada) 
                       ? `<button class="btn btn-outline-danger" onclick="anularCompra(${c.id})">Anular</button>` 
                       : (anulada ? '<span class="badge bg-secondary">Anulada</span>' : '') 
                    }
                </div>
            `;
            tr.lastElementChild.innerHTML = accionesHtml;
            
            tbody.appendChild(tr);
        });
        
        $("resumenLista").textContent = `Página ${page}`;
        $("btnPrev").disabled = (page <= 1);

    } catch (err) {
        console.error(err);
    }
}

// Función para anular (revertir stock) - CONSERVADA DE TU CÓDIGO ANTIGUO
window.anularCompra = async (id) => {
    if(!confirm(`¿Seguro que deseas ANULAR la compra #${id}? Se descontará el stock.`)) return;
    try {
        const fd = new FormData(); fd.append("id", id);
        await fetchJSON(`${BASE}/api/compras/void.php`, {
             method: "POST",
             body: fd // Usamos FormData como en tu código original
        });
        alert("Compra anulada correctamente.");
        listarCompras();
    } catch (e) {
        alert("Error al anular: " + e.message);
    }
};

// Eventos de filtros historial
$("btnBuscar").addEventListener("click", () => { page = 1; listarCompras(); });
$("btnLimpiar").addEventListener("click", () => { 
    $("q").value = ""; $("f_desde").value = ""; $("f_hasta").value = ""; 
    page = 1; listarCompras(); 
});
$("btnPrev").addEventListener("click", () => { if(page > 1) { page--; listarCompras(); } });
$("btnNext").addEventListener("click", () => { page++; listarCompras(); });

// =====================================================
// 6. INICIALIZACIÓN
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosIniciales();
    listarCompras();
});