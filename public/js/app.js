// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    async function checkSession() {
        try {
            const response = await fetch("/PuertoSurDB/api/auth/me.php");
            if (!response.ok) {
                throw new Error('Sesión no válida');
            }
            const me = await response.json();
            window.__ME__ = me;
            const userInfoEl = document.getElementById("userInfo");
            if (userInfoEl) {
                userInfoEl.textContent = `${me.nombre} (${me.rol})`;
            }
        } catch (error) {
            location.href = "login.html";
        }
    }

    async function logout() {
        await fetch("/PuertoSurDB/api/auth/logout.php");
        window.__ME__ = null; 
        location.href = "login.html";
    }

    
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    
    checkSession();
});