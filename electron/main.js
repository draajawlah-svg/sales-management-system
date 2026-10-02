import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeDatabase, db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 950,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  initializeDatabase();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dashboard:getSummary', () => {
  const totalSales = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM sales').get();
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  const todaySales = db.prepare(
    'SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date(created_at) = date("now")'
  ).get();

  return {
    totalSales: Number(totalSales.total || 0),
    totalProducts: Number(totalProducts.count || 0),
    totalCustomers: Number(totalCustomers.count || 0),
    todaySales: Number(todaySales.total || 0)
  };
});

ipcMain.handle('products:list', () => {
  return db.prepare('SELECT * FROM products ORDER BY id DESC').all();
});

ipcMain.handle('products:save', (_event, product) => {
  if (product.id) {
    db.prepare(`
      UPDATE products
      SET name = @name, price = @price, category = @category, stock = @stock, description = @description, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run(product);
    return product;
  }

  const result = db.prepare(`
    INSERT INTO products (name, price, category, stock, description)
    VALUES (@name, @price, @category, @stock, @description)
  `).run(product);

  return { ...product, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('products:delete', (_event, id) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return true;
});

ipcMain.handle('customers:list', () => {
  return db.prepare('SELECT * FROM customers ORDER BY id DESC').all();
});

ipcMain.handle('customers:save', (_event, customer) => {
  if (customer.id) {
    db.prepare(`
      UPDATE customers
      SET name = @name, phone = @phone, email = @email, address = @address, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run(customer);
    return customer;
  }

  const result = db.prepare(`
    INSERT INTO customers (name, phone, email, address)
    VALUES (@name, @phone, @email, @address)
  `).run(customer);

  return { ...customer, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('customers:delete', (_event, id) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return true;
});

ipcMain.handle('sales:list', () => {
  return db.prepare('SELECT * FROM sales ORDER BY id DESC LIMIT 100').all();
});

ipcMain.handle('sales:create', (_event, payload) => {
  const { customerId, items, total } = payload;

  const result = db.prepare(`
    INSERT INTO sales (customer_id, total, status)
    VALUES (@customerId, @total, 'paid')
  `).run({ customerId, total });

  const saleId = Number(result.lastInsertRowid);

  for (const item of items) {
    db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total)
      VALUES (@saleId, @productId, @quantity, @unitPrice, @total)
    `).run({
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      total: Number(item.quantity) * Number(item.price)
    });

    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
  }

  return { id: saleId, customerId, total };
});
