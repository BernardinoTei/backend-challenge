const express = require('express');
const app = express();

app.use(express.json());

// In-memory database
let products = [
  { id: 1, name: 'Laptop', price: 999, stock: 10 },
  { id: 2, name: 'Mouse', price: 25, stock: 50 },
  { id: 3, name: 'Keyboard', price: 75, stock: 30 }
];

let orders = [];
let orderIdCounter = 1;

// BUG 1: Missing await in async function
// BUG 2: Race condition in stock management
// BUG 3: Incorrect async error handling

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  // BUG: No null check
  res.json(product);
});

// Simulate async database operation
function simulateDbDelay() {
  return new Promise(resolve => setTimeout(resolve, 100));
}

// Create order (has race condition)
app.post('/api/orders', async (req, res) => {
  const { productId, quantity } = req.body;
  
  // BUG: Missing await - race condition!
  simulateDbDelay();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // BUG: Race condition - two requests can pass this check simultaneously
  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  
  // BUG: Not atomic - stock update can be overwritten
  product.stock = product.stock - quantity;
  
  const order = {
    id: orderIdCounter++,
    productId,
    quantity,
    totalPrice: product.price * quantity,
    status: 'pending',
    createdAt: new Date()
  };
  
  orders.push(order);
  
  res.status(201).json(order);
});

// Update product stock (has async bug)
app.patch('/api/products/:id/stock', async (req, res) => {
  const { stock } = req.body;
  const productId = parseInt(req.params.id);
  
  // BUG: Missing try-catch for async operations
  simulateDbDelay();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // BUG: No validation of stock value
  product.stock = stock;
  
  res.json(product);
});

// Get order by ID (callback hell)
app.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  
  // BUG: Callback hell and no error handling
  setTimeout(() => {
    const order = orders.find(o => o.id === orderId);
    
    setTimeout(() => {
      if (order) {
        const product = products.find(p => p.id === order.productId);
        
        setTimeout(() => {
          // BUG: No check if product exists
          res.json({
            ...order,
            productName: product.name,
            productPrice: product.price
          });
        }, 50);
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    }, 50);
  }, 50);
});

// Cancel order (missing await)
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = parseInt(req.params.id);
  
  // BUG: Missing await
  simulateDbDelay();
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const order = orders[orderIndex];
  
  // BUG: Missing await - stock restoration happens too late
  simulateDbDelay();
  
  // Return stock
  const product = products.find(p => p.id === order.productId);
  if (product) {
    product.stock += order.quantity;
  }
  
  orders.splice(orderIndex, 1);
  
  res.json({ message: 'Order cancelled' });
});

// Bulk update products (Promise handling bug)
app.post('/api/products/bulk-update', async (req, res) => {
  const updates = req.body.updates; // Array of {id, price, stock}
  
  // BUG: Not waiting for all promises to complete
  const results = updates.map(update => {
    return simulateDbDelay().then(() => {
      const product = products.find(p => p.id === update.id);
      if (product) {
        if (update.price) product.price = update.price;
        if (update.stock !== undefined) product.stock = update.stock;
        return product;
      }
      return null;
    });
  });
  
  // BUG: Sending response before promises resolve
  res.json({ 
    message: 'Products updated',
    updated: results.length 
  });
});

module.exports = app;
