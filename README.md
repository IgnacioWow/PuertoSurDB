# PuertoSurDB

Sistema liviano de **control de stock** para red local (PHP + MySQL + Bootstrap).

## Stack
- PHP (XAMPP) + MySQL (utf8mb4)
- Frontend: HTML + Bootstrap + JS
- Arquitectura: API REST simple (PHP + PDO), UI separada en `/public`

## Estructura
PuertoSurDB/
api/
auth/ # login/logout/me
catalogos/ # listas de categorías y unidades
config/ # db.php (PDO)
movimientos/ # kardex (create/list)
productos/ # CRUD + get/list
_auth.php # middleware de sesión/roles
public/
index.html # tabla de productos
productos.html # CRUD productos
movimientos.html
css/estilos.css
js/*.js
sql/
schema.sql # tablas, vistas y seeds

## Instalación rápida
1. Copiar carpeta a `C:\xampp\htdocs\PuertoSurDB`.
2. Importar `sql/schema.sql` en `phpMyAdmin` (BD `tienda_stock`).
3. Generar hash admin:  
   - Abrir `/api/auth/util_hash.php?pwd=TU_CLAVE`
   - `UPDATE usuarios SET pass_hash='HASH' WHERE email='admin@example.com';`
4. Encender **Apache** y **MySQL**.
5. Ir a `public/login.html`.

Credenciales demo:
- Admin: `admin@example.com` / (tu clave)
- Vendedor: `vendedor@example.com` / `vendedor123` (si lo creas con la instrucción del repo)

## Roles
- **admin**: CRUD productos, crear movimientos.
- **vendedor**: solo lectura (listados y get).

## Desarrollo
- API protegida con `_auth.php` (sesión PHP).
- Stock se calcula desde **kardex** (`movimientos` y vistas).
- .gitignore sugerido:
/vendor/
/node_modules/
.DS_Store
Thumbs.db
*.env
*.log
*.sqlite

## Próximo
- Alertas de stock bajo (reporte).
- Impresión de etiquetas (códigos de barras).
- PWA / App móvil.
