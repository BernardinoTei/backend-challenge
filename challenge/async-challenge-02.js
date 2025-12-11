const express = require('express');
const app = express();

app.use(express.json());


let products = [
  { id: 1, name: 'Laptop', price: 999, stock: 10 },
  { id: 2, name: 'Mouse', price: 25, stock: 50 },
  { id: 3, name: 'Keyboard', price: 75, stock: 30 }
];

let orders = [];
let orderIdCounter = 1;

app.get('/api/products', (req, res) => {
  res.json(products);
});


app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  

  res.json(product);
});


function simulateDbDelay() {
  return new Promise(resolve => setTimeout(resolve, 100));
}


app.post('/api/orders', async (req, res) => {
  const { productId, quantity } = req.body;
  

  simulateDbDelay();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  

  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  

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


app.patch('/api/products/:id/stock', async (req, res) => {
  const { stock } = req.body;
  const productId = parseInt(req.params.id);
  

  simulateDbDelay();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  

  product.stock = stock;
  
  res.json(product);
});


app.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  

  setTimeout(() => {
    const order = orders.find(o => o.id === orderId);
    
    setTimeout(() => {
      if (order) {
        const product = products.find(p => p.id === order.productId);
        
        setTimeout(() => {
 
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


app.delete('/api/orders/:id', async (req, res) => {
  const orderId = parseInt(req.params.id);
  

  simulateDbDelay();
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const order = orders[orderIndex];
  

  simulateDbDelay();
  

  const product = products.find(p => p.id === order.productId);
  if (product) {
    product.stock += order.quantity;
  }
  
  orders.splice(orderIndex, 1);
  
  res.json({ message: 'Order cancelled' });
});


app.post('/api/products/bulk-update', async (req, res) => {
  const updates = req.body.updates; 
  

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
  
 
  res.json({ 
    message: 'Products updated',
    updated: results.length 
  });
});

module.exports = app;
