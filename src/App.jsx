import { useEffect, useMemo, useState } from 'react';

const emptyProduct = {
  id: null,
  name: '',
  price: 0,
  category: '',
  stock: 0,
  description: ''
};

const emptyCustomer = {
  id: null,
  name: '',
  phone: '',
  email: '',
  address: ''
};

export default function App() {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]);

  const fetchData = async () => {
    const [summaryRes, productsRes, customersRes, salesRes] = await Promise.all([
      window.api.getDashboardSummary(),
      window.api.listProducts(),
      window.api.listCustomers(),
      window.api.listSales()
    ]);

    setSummary(summaryRes);
    setProducts(productsRes);
    setCustomers(customersRes);
    setSales(salesRes);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      return;
    }

    setCart((prev) => [
      ...prev,
      { productId: Number(product.id), name: product.name, quantity: 1, price: Number(product.price) }
    ]);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCart = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );

  const saveProduct = async () => {
    await window.api.saveProduct(productForm);
    setProductForm(emptyProduct);
    fetchData();
  };

  const saveCustomer = async () => {
    await window.api.saveCustomer(customerForm);
    setCustomerForm(emptyCustomer);
    fetchData();
  };

  const createSale = async () => {
    if (!selectedCustomerId || cart.length === 0) {
      alert('يرجى اختيار عميل وإضافة منتجات إلى الفاتورة');
      return;
    }

    await window.api.createSale({
      customerId: Number(selectedCustomerId),
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      total: totalCart
    });

    setCart([]);
    setSelectedCustomerId('');
    fetchData();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>المبيعات</h1>
        <nav>
          <span>لوحة التحكم</span>
          <span>المنتجات</span>
          <span>العملاء</span>
          <span>الفواتير</span>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <h2>لوحة التحكم</h2>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <label>إجمالي المبيعات</label>
            <strong>{Number(summary.totalSales || 0).toFixed(2)} ر.س</strong>
          </div>
          <div className="stat-card">
            <label>المنتجات</label>
            <strong>{summary.totalProducts}</strong>
          </div>
          <div className="stat-card">
            <label>العملاء</label>
            <strong>{summary.totalCustomers}</strong>
          </div>
          <div className="stat-card accent">
            <label>مبيعات اليوم</label>
            <strong>{Number(summary.todaySales || 0).toFixed(2)} ر.س</strong>
          </div>
        </section>

        <section className="grid-two">
          <div className="panel">
            <h3>إضافة منتج</h3>
            <div className="form-grid">
              <input
                placeholder="اسم المنتج"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <input
                placeholder="السعر"
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
              />
              <input
                placeholder="الفئة"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
              <input
                placeholder="المخزون"
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
              />
              <textarea
                placeholder="الوصف"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            <button className="primary" onClick={saveProduct}>حفظ المنتج</button>
          </div>

          <div className="panel">
            <h3>إضافة عميل</h3>
            <div className="form-grid">
              <input
                placeholder="اسم العميل"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
              <input
                placeholder="الهاتف"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
              <input
                placeholder="البريد الإلكتروني"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
              <textarea
                placeholder="العنوان"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
            </div>
            <button className="primary" onClick={saveCustomer}>حفظ العميل</button>
          </div>
        </section>

        <section className="grid-two multi-row">
          <div className="panel">
            <h3>المنتجات</h3>
            <div className="list-box">
              {products.map((product) => (
                <div className="list-item" key={String(product.id)}>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.category}</small>
                  </div>
                  <div className="item-actions">
                    <span>{Number(product.price).toFixed(2)} ر.س</span>
                    <button onClick={() => addToCart(product)}>إضافة</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>الفاتورة الحالية</h3>
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={String(customer.id)} value={String(customer.id)}>
                  {customer.name}
                </option>
              ))}
            </select>

            <div className="cart-box">
              {cart.length === 0 ? (
                <p>لا توجد منتجات في الفاتورة</p>
              ) : (
                cart.map((item) => (
                  <div className="cart-item" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{Number(item.price).toFixed(2)} ر.س</small>
                    </div>
                    <div className="qty-controls">
                      <button onClick={() => updateCartQuantity(item.productId, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.productId, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="total-row">
              <span>الإجمالي</span>
              <strong>{Number(totalCart).toFixed(2)} ر.س</strong>
            </div>

            <button className="primary full" onClick={createSale}>تأكيد الفاتورة</button>
          </div>
        </section>

        <section className="panel">
          <h3>آخر المبيعات</h3>
          <table>
            <thead>
              <tr>
                <th>رقم</th>
                <th>العميل</th>
                <th>الإجمالي</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.customer_id}</td>
                  <td>{Number(sale.total).toFixed(2)} ر.س</td>
                  <td>{new Date(sale.created_at).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
