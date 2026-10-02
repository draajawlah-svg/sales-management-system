import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

export const db = new Database(path.join(app.getPath('userData'), 'sales_manager.db'));

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      category TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'paid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    db.prepare(`
      INSERT INTO products (name, price, category, stock, description)
      VALUES
      ('قهوة عربية', 12, 'مشروبات', 35, 'قهوة عربية ممتازة'),
      ('شاي أخضر', 8, 'مشروبات', 40, 'شاي أخضر طبيعي'),
      ('مياه معدنية', 4, 'مشروبات', 60, 'مياه صغيرة'),
      ('كيك الشوكولاتة', 18, 'حلويات', 24, 'كيك بالشوكولاتة'),
      ('بسكويت', 9, 'حلويات', 50, 'بسكويت مالح ومقرمش')
    `).run();
  }

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  if (customerCount.count === 0) {
    db.prepare(`
      INSERT INTO customers (name, phone, email, address)
      VALUES
      ('أحمد علي', '0500000000', 'ahmed@example.com', 'الرياض'),
      ('سارة محمد', '0555555555', 'sara@example.com', 'جدة')
    `).run();
  }
}
