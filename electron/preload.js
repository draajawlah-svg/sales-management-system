import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getDashboardSummary: () => ipcRenderer.invoke('dashboard:getSummary'),
  listProducts: () => ipcRenderer.invoke('products:list'),
  saveProduct: (product) => ipcRenderer.invoke('products:save', product),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  listCustomers: () => ipcRenderer.invoke('customers:list'),
  saveCustomer: (customer) => ipcRenderer.invoke('customers:save', customer),
  deleteCustomer: (id) => ipcRenderer.invoke('customers:delete', id),
  listSales: () => ipcRenderer.invoke('sales:list'),
  createSale: (payload) => ipcRenderer.invoke('sales:create', payload)
});
