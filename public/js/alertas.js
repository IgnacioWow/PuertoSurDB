// Panel de alertas de stock bajo (persistente, lado derecho)
const BASE = "/PuertoSurDB";
let psPanel, psHeader, psBody, psToggle;
let psMinimized = false; // en desktop inicia expandido; en móvil lo forzamos abajo

function createPanel() {
  psPanel = document.createElement('aside');
  psPanel.className = 'ps-alert-panel';
  psPanel.setAttribute('role', 'alert');

  psHeader = document.createElement('div');
  psHeader.className = 'ps-alert-header';
  psHeader.innerHTML = `⚠️ <span>Stock bajo</span>`;

  psToggle = document.createElement('button');
  psToggle.className = 'ps-alert-toggle';
  psToggle.type = 'button';
  psToggle.setAttribute('aria-label','Minimizar alerta');
  psToggle.textContent = '—';
  psToggle.addEventListener('click', togglePanel);

  psHeader.appendChild(psToggle);

  psBody = document.createElement('div');
  psBody.className = 'ps-alert-body';
  psBody.innerHTML = `<div class="text-muted small px-1 py-2">Cargando…</div>`;

  psPanel.appendChild(psHeader);
  psPanel.appendChild(psBody);
  document.body.appendChild(psPanel);

  // En pantallas chicas, arrancar minimizado
  if (window.matchMedia('(max-width: 992px)').matches) {
    psMinimized = true;
    psPanel.classList.add('minimized');
    psToggle.textContent = '+';
  }
}

function togglePanel() {
  psMinimized = !psMinimized;
  psPanel.classList.toggle('minimized', psMinimized);
  psToggle.textContent = psMinimized ? '+' : '—';
}

async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function render(items) {
  if (!Array.isArray(items)) items = [];

  if (items.length === 0) {
    psBody.innerHTML = `<div class="text-muted small px-1 py-2">Sin alertas de stock bajo.</div>`;
    // mostrar un puntito rojo en cabecera cuando está minimizado y no hay lista
    const dot = psHeader.querySelector('.ps-dot');
    if (dot) dot.remove();
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'ps-alert-item';
    row.innerHTML = `
      <div class="text-truncate">
        <strong>${it.sku}</strong> — ${it.nombre}
      </div>
      <div>
        <span class="ps-badge">${it.stock_actual ?? 0}</span>
        <span class="ps-badge min">min ${it.stock_minimo ?? 0}</span>
      </div>
    `;
    // click abre productos y filtra por SKU (si estás en esa página)
    row.addEventListener('click', () => {
      try {
        const q = document.getElementById('q');
        const btnBuscar = document.getElementById('btnBuscar');
        if (q && btnBuscar) { q.value = it.sku; btnBuscar.click(); }
      } catch {}
    });
    frag.appendChild(row);
  });

  psBody.innerHTML = '';
  psBody.appendChild(frag);

  // si está minimizado, muestra un puntito rojo para llamar la atención
  if (psMinimized) {
    if (!psHeader.querySelector('.ps-dot')) {
      const dot = document.createElement('span'); dot.className = 'ps-dot';
      psHeader.appendChild(dot);
    }
  } else {
    const dot = psHeader.querySelector('.ps-dot'); if (dot) dot.remove();
  }
}

async function loadAlerts() {
  try {
    const data = await fetchJSON(`${BASE}/api/alertas/stock_bajo.php`);
    render(data.items || []);
  } catch (e) {
    psBody.innerHTML = `<div class="text-danger small px-1 py-2">No se pudo cargar alertas.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  createPanel();
  loadAlerts();
  // refresco periódico
  setInterval(loadAlerts, 45000);
});
