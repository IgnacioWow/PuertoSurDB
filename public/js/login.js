const BASE = "/PuertoSurDB";
const $ = (id) => document.getElementById(id);

async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

document.getElementById("formLogin").addEventListener("submit", async (e)=>{
  e.preventDefault();
  $("msg").textContent = "";
  try {
    const resp = await fetchJSON(`${BASE}/api/auth/login.php`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        email: $("email").value.trim(),
        password: $("password").value
      })
    });
    // Redirige a productos por defecto
    window.location.href = "productos.html";
  } catch (_e) {
    $("msg").textContent = "Credenciales inválidas.";
    $("msg").className = "mt-3 small text-center text-danger";
  }
});
