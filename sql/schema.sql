-- PuertoSurBD Esquema inicial
CREATE DATABASE IF NOT EXISTS tienda_stock
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_stock;

-- Tablas básicas
CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  rol_id TINYINT UNSIGNED NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE categorias (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL,
  UNIQUE(nombre)
);

CREATE TABLE unidades (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) UNIQUE NOT NULL,      -- p.ej. unidad, caja, kg
  abreviatura VARCHAR(10) UNIQUE NOT NULL  -- ud, cj, kg
);

CREATE TABLE proveedores (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  rut VARCHAR(20) UNIQUE NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(120) NULL,
  direccion VARCHAR(180) NULL
);

CREATE TABLE clientes (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  rut VARCHAR(20) UNIQUE NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(120) NULL,
  direccion VARCHAR(180) NULL
);

CREATE TABLE productos (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  unidad_id TINYINT UNSIGNED NOT NULL,
  precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_minimo INT UNSIGNED NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (unidad_id) REFERENCES unidades(id),
  INDEX idx_cat (categoria_id),
  INDEX idx_nombre (nombre)
);

CREATE TABLE producto_barcodes (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  barcode VARCHAR(64) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'EAN13', -- EAN13, CODE128, etc.
  UNIQUE(barcode),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Movimientos de inventario (kardex)
CREATE TABLE movimientos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo ENUM('COMPRA','VENTA','AJUSTE_POS','AJUSTE_NEG','DEV_COMPRA','DEV_VENTA') NOT NULL,
  cantidad INT NOT NULL,                    -- positivo entrada / negativo salida
  costo_unitario DECIMAL(12,4) NULL,       -- para compras/ajustes
  precio_unitario DECIMAL(12,4) NULL,      -- para ventas/devoluciones
  referencia VARCHAR(40) NULL,             -- código doc relacionado
  nota VARCHAR(255) NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  INDEX (producto_id, fecha)
);

-- Compras
CREATE TABLE compras (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proveedor_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  num_doc VARCHAR(40) NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  iva DECIMAL(14,2) NOT NULL,
  total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  UNIQUE(proveedor_id, num_doc)
);

CREATE TABLE compras_det (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  compra_id BIGINT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(12,4) NOT NULL,
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  UNIQUE(compra_id, producto_id)
);

-- Ventas
CREATE TABLE ventas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT UNSIGNED NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  num_doc VARCHAR(40) NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  iva DECIMAL(14,2) NOT NULL,
  total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  UNIQUE(num_doc)
);

CREATE TABLE ventas_det (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  venta_id BIGINT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(12,4) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  UNIQUE(venta_id, producto_id)
);

-- Vistas útiles
CREATE OR REPLACE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.sku,
  p.nombre,
  COALESCE(SUM(m.cantidad),0) AS stock
FROM productos p
LEFT JOIN movimientos m ON m.producto_id = p.id
GROUP BY p.id, p.sku, p.nombre;

CREATE OR REPLACE VIEW v_valorizado AS
SELECT
  p.id producto_id, p.sku, p.nombre,
  COALESCE(SUM(m.cantidad),0) stock,
  ROUND(AVG(NULLIF(m.costo_unitario,0)),4) costo_prom,
  ROUND(COALESCE(SUM(m.cantidad),0) * AVG(NULLIF(m.costo_unitario,0)),2) valor_costo
FROM productos p
LEFT JOIN movimientos m ON m.producto_id=p.id AND m.costo_unitario IS NOT NULL
GROUP BY p.id, p.sku, p.nombre;

-- Datos seed mínimos
INSERT INTO roles (nombre) VALUES ('admin'), ('vendedor');
INSERT INTO unidades (nombre,abreviatura) VALUES ('Unidad','ud'),('Caja','cj');
INSERT INTO categorias (nombre) VALUES ('General');
INSERT INTO usuarios (nombre,email,pass_hash,rol_id)
VALUES ('Administrador','admin@example.com','$2y$10$hashDeEjemplo',1); -- reemplaza hash
